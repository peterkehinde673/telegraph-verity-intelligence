#![cfg_attr(not(test), no_std)]

//! Deterministic lexical-overlap baseline for Telegraph's FACT_CHECK scorer.
//! This is a prototype scorer, not a fact-checking engine. It compares the
//! candidate answer with the supplied ground truth and never uses the network.

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

fn count_occurrences(bytes: &[u8], token: &[u8]) -> usize {
    let mut count = 0;
    let mut cursor = 0;
    while let Some((start, end, next)) = next_token(bytes, cursor) {
        if token_equal(&bytes[start..end], token) {
            count += 1;
        }
        cursor = next;
    }
    count
}

fn token_seen_before(bytes: &[u8], token_start: usize, token: &[u8]) -> bool {
    let mut cursor = 0;
    while let Some((start, end, next)) = next_token(bytes, cursor) {
        if start >= token_start {
            return false;
        }
        if token_equal(&bytes[start..end], token) {
            return true;
        }
        cursor = next;
    }
    false
}

fn token_count(bytes: &[u8]) -> usize {
    let mut count = 0;
    let mut cursor = 0;
    while let Some((_start, _end, next)) = next_token(bytes, cursor) {
        count += 1;
        cursor = next;
    }
    count
}

fn matched_token_count(answer: &[u8], truth: &[u8]) -> usize {
    let mut matched = 0;
    let mut cursor = 0;
    while let Some((start, end, next)) = next_token(answer, cursor) {
        let token = &answer[start..end];
        if !token_seen_before(answer, start, token) {
            let answer_occurrences = count_occurrences(answer, token);
            let truth_occurrences = count_occurrences(truth, token);
            matched += core::cmp::min(answer_occurrences, truth_occurrences);
        }
        cursor = next;
    }
    matched
}

fn score_bytes(question: &[u8], truth: &[u8], answer: &[u8]) -> f32 {
    let _ = question; // Available for future intent-specific scoring features.

    if answer.iter().all(|b| b.is_ascii_whitespace()) || truth.iter().all(|b| b.is_ascii_whitespace()) {
        return 0.0;
    }

    let answer_tokens = token_count(answer);
    let truth_tokens = token_count(truth);
    if answer_tokens == 0 || truth_tokens == 0 {
        return 0.0;
    }

    let matched = matched_token_count(answer, truth);
    if matched == 0 {
        return 0.0;
    }

    let precision = matched as f32 / answer_tokens as f32;
    let recall = matched as f32 / truth_tokens as f32;
    let denominator = precision + recall;
    if denominator <= 0.0 {
        0.0
    } else {
        (2.0 * precision * recall / denominator).clamp(0.0, 1.0)
    }
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
