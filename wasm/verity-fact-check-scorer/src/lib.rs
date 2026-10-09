#![cfg_attr(not(test), no_std)]

//! Deterministic lexical-overlap baseline for Telegraph's FACT_CHECK scorer.
//! This is a prototype scorer, not a fact-checking engine. It compares the
//! candidate answer with the supplied ground truth and never uses the network.


#[cfg(not(test))]
use core::panic::PanicInfo;

// A no_std cdylib has no standard-library panic handler. Trap immediately if
// an internal panic occurs so the host cannot continue with corrupted state.
#[cfg(not(test))]
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

const HEAP_SIZE: usize = 2 * 1024 * 1024;
static mut HEAP: [u8; HEAP_SIZE] = [0; HEAP_SIZE];
static mut HEAP_OFFSET: usize = 0;

/// Allocate memory for the host to write UTF-8 input bytes into.
#[no_mangle]
pub extern "C" fn alloc(size: i32) -> i32 {
    if size <= 0 || size as usize > HEAP_SIZE {
        return 0;
    }

    unsafe {
        let aligned = (HEAP_OFFSET + 7) & !7;
        if aligned.saturating_add(size as usize) > HEAP_SIZE {
            // A single invocation should fit in this bounded heap. Resetting
            // here avoids out-of-bounds access; the host must allocate inputs
            // within one call's capacity.
            HEAP_OFFSET = 0;
        } else {
            HEAP_OFFSET = aligned;
        }

        let ptr = core::ptr::addr_of_mut!(HEAP).cast::<u8>().add(HEAP_OFFSET);
        HEAP_OFFSET = HEAP_OFFSET.saturating_add(size as usize);
        ptr as i32
    }
}

/// This module uses a bump allocator; memory is reclaimed between invocations.
#[no_mangle]
pub extern "C" fn dealloc(_ptr: i32, _size: i32) {}

#[inline]
fn lower_ascii(byte: u8) -> u8 {
    if byte >= b'A' && byte <= b'Z' {
        byte + (b'a' - b'A')
    } else {
        byte
    }
}

#[inline]
fn is_word_byte(byte: u8) -> bool {
    byte >= 0x80
        || (byte >= b'a' && byte <= b'z')
        || (byte >= b'A' && byte <= b'Z')
        || (byte >= b'0' && byte <= b'9')
}

fn next_token(bytes: &[u8], from: usize) -> Option<(usize, usize, usize)> {
    let mut start = from;
    while start < bytes.len() && !is_word_byte(bytes[start]) {
        start += 1;
    }
    if start == bytes.len() {
        return None;
    }

    let mut end = start;
    while end < bytes.len() && is_word_byte(bytes[end]) {
        end += 1;
    }
    Some((start, end, end))
}

fn token_equal(left: &[u8], right: &[u8]) -> bool {
    left.len() == right.len()
        && left.iter().zip(right.iter()).all(|(a, b)| lower_ascii(*a) == lower_ascii(*b))
}

const TOKEN_TABLE_SIZE: usize = 16_384;

#[derive(Clone, Copy)]
struct TokenSlot {
    hash: u64,
    count: u32,
}

const EMPTY_SLOT: TokenSlot = TokenSlot { hash: 0, count: 0 };

fn token_hash(token: &[u8]) -> u64 {
    let mut hash = 0xcbf29ce484222325u64;
    for byte in token {
        hash ^= lower_ascii(*byte) as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    // Zero marks an unused slot.
    if hash == 0 { 1 } else { hash }
}

fn find_slot(table: &[TokenSlot], hash: u64) -> Option<usize> {
    let mut index = (hash as usize) & (table.len() - 1);
    for _ in 0..table.len() {
        let slot = table[index];
        if slot.hash == 0 || slot.hash == hash {
            return Some(index);
        }
        index = (index + 1) & (table.len() - 1);
    }
    None
}

fn score_bytes(question: &[u8], truth: &[u8], answer: &[u8]) -> f32 {
    let _ = question; // Available for future intent-specific scoring features.

    if answer.iter().all(|b| b.is_ascii_whitespace())
        || truth.iter().all(|b| b.is_ascii_whitespace())
    {
        return 0.0;
    }

    // Count ground-truth token frequencies in a bounded hash table. This keeps
    // long-input scoring near-linear instead of repeatedly rescanning strings.
    let mut table = [EMPTY_SLOT; TOKEN_TABLE_SIZE];
    let mut truth_tokens = 0usize;
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(truth, cursor) {
        let hash = token_hash(&truth[start..end]);
        let index = match find_slot(&table, hash) {
            Some(index) => index,
            None => return 0.0,
        };
        if table[index].hash == 0 {
            table[index].hash = hash;
        }
        table[index].count = table[index].count.saturating_add(1);
        truth_tokens += 1;
        cursor = next;
    }

    let mut answer_tokens = 0usize;
    let mut matched = 0usize;
    cursor = 0;
    while let Some((start, end, next)) = next_token(answer, cursor) {
        let hash = token_hash(&answer[start..end]);
        if let Some(index) = find_slot(&table, hash) {
            if table[index].hash == hash && table[index].count > 0 {
                table[index].count -= 1;
                matched += 1;
            }
        }
        answer_tokens += 1;
        cursor = next;
    }

    if answer_tokens == 0 || truth_tokens == 0 || matched == 0 {
        return 0.0;
    }

    let denominator = answer_tokens + truth_tokens;
    ((2.0 * matched as f32) / denominator as f32).clamp(0.0, 1.0)
}

unsafe fn input_slice<'a>(ptr: i32, len: i32) -> &'a [u8] {
    if len <= 0 || ptr == 0 {
        return &[];
    }
    core::slice::from_raw_parts(ptr as *const u8, len as usize)
}

/// Returns a deterministic score in [0, 1] for the candidate answer.
///
/// ABI: rank_answer(question_ptr, question_len, ground_truth_ptr,
/// ground_truth_len, miner_answer_ptr, miner_answer_len) -> f32.
#[no_mangle]
pub unsafe extern "C" fn rank_answer(
    q_ptr: i32,
    q_len: i32,
    gt_ptr: i32,
    gt_len: i32,
    ma_ptr: i32,
    ma_len: i32,
) -> f32 {
    let question = input_slice(q_ptr, q_len);
    let ground_truth = input_slice(gt_ptr, gt_len);
    let miner_answer = input_slice(ma_ptr, ma_len);
    score_bytes(question, ground_truth, miner_answer)
}

#[cfg(test)]
mod tests {
    use super::score_bytes;

    #[test]
    fn exact_answer_scores_one() {
        assert_eq!(
            score_bytes(b"capital?", b"Paris is the capital of France.", b"Paris is the capital of France."),
            1.0
        );
    }

    #[test]
    fn punctuation_and_case_do_not_change_match() {
        assert_eq!(
            score_bytes(b"q", b"Paris is the capital.", b"PARIS, is the capital!"),
            1.0
        );
    }

    #[test]
    fn unrelated_answer_scores_zero() {
        assert_eq!(
            score_bytes(b"q", b"Paris is the capital of France.", b"Quantum mechanics explains particles."),
            0.0
        );
    }

    #[test]
    fn blank_answer_scores_zero() {
        assert_eq!(score_bytes(b"q", b"known answer", b"  \n\t "), 0.0);
    }

    #[test]
    fn partial_answer_scores_below_exact_answer() {
        let partial = score_bytes(b"q", b"Paris is the capital of France", b"Paris is the capital");
        let exact = score_bytes(b"q", b"Paris is the capital of France", b"Paris is the capital of France");
        assert!(partial > 0.0 && partial < exact);
    }

    #[test]
    fn unicode_input_does_not_panic() {
        let score = score_bytes("q".as_bytes(), "東京 is a city 🗼".as_bytes(), "東京 is a city 🗼".as_bytes());
        assert_eq!(score, 1.0);
    }

    #[test]
    fn long_inputs_do_not_panic() {
        let truth = "correct answer ".repeat(5000);
        let answer = "correct answer ".repeat(5000);
        assert_eq!(score_bytes(b"q", truth.as_bytes(), answer.as_bytes()), 1.0);
    }
}
