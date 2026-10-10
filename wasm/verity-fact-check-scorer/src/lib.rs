#![cfg_attr(not(test), no_std)]

//! Deterministic, content-weighted lexical scorer for Telegraph FACT_CHECK.
//! This is still a lexical baseline, not a semantic fact-checking engine.
//! V13 supplements content-weighted token overlap with an order-sensitive bigram signal.
//! Release note: V13 keeps unigram evidence dominant and adds a 15% phrase-order component.
//! Release note: combines unigram and bigram overlap; protocol scoring must confirm promotion.
//! Keeps V12's twelfth-power odds calibration and existing contradiction guards.
//! Keeps V11 content-word weighting and existing contradiction guards.
//! Release build note: eighth-power odds plus precision and contradiction penalties.
//! It compares the candidate answer to the supplied reference and performs no
//! network access. Common function words receive less weight than factual terms.

#[cfg(not(test))]
use core::panic::PanicInfo;

#[cfg(not(test))]
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

const HEAP_SIZE: usize = 2 * 1024 * 1024;
static mut HEAP: [u8; HEAP_SIZE] = [0; HEAP_SIZE];
static mut HEAP_OFFSET: usize = 0;

#[no_mangle]
pub extern "C" fn alloc(size: i32) -> i32 {
    if size <= 0 || size as usize > HEAP_SIZE {
        return 0;
    }
    unsafe {
        let aligned = (HEAP_OFFSET + 7) & !7;
        if aligned.saturating_add(size as usize) > HEAP_SIZE {
            HEAP_OFFSET = 0;
        } else {
            HEAP_OFFSET = aligned;
        }
        let ptr = core::ptr::addr_of_mut!(HEAP).cast::<u8>().add(HEAP_OFFSET);
        HEAP_OFFSET = HEAP_OFFSET.saturating_add(size as usize);
        ptr as i32
    }
}

#[no_mangle]
pub extern "C" fn dealloc(_ptr: i32, _size: i32) {}

#[inline]
fn lower_ascii(byte: u8) -> u8 {
    if byte >= b'A' && byte <= b'Z' { byte + (b'a' - b'A') } else { byte }
}

#[inline]
fn is_word_byte(byte: u8) -> bool {
    byte >= 0x80 || (byte >= b'a' && byte <= b'z')
        || (byte >= b'A' && byte <= b'Z') || (byte >= b'0' && byte <= b'9')
}

fn next_token(bytes: &[u8], from: usize) -> Option<(usize, usize, usize)> {
    let mut start = from;
    while start < bytes.len() && !is_word_byte(bytes[start]) { start += 1; }
    if start == bytes.len() { return None; }
    let mut end = start;
    while end < bytes.len() && is_word_byte(bytes[end]) { end += 1; }
    Some((start, end, end))
}

const TOKEN_TABLE_SIZE: usize = 16_384;

#[derive(Clone, Copy)]
struct TokenSlot { hash: u64, count: u32 }
const EMPTY_SLOT: TokenSlot = TokenSlot { hash: 0, count: 0 };

fn token_hash(token: &[u8]) -> u64 {
    let mut hash = 0xcbf29ce484222325u64;
    for byte in token {
        hash ^= lower_ascii(*byte) as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    if hash == 0 { 1 } else { hash }
}

fn find_slot(table: &[TokenSlot], hash: u64) -> Option<usize> {
    let mut index = (hash as usize) & (table.len() - 1);
    for _ in 0..table.len() {
        let slot = table[index];
        if slot.hash == 0 || slot.hash == hash { return Some(index); }
        index = (index + 1) & (table.len() - 1);
    }
    None
}

// Function words carry less evidential value in a fact-check than names,
// dates, quantities, and other content words. Keep this deliberately small,
// deterministic, and language-agnostic beyond common English function words.
fn token_weight(token: &[u8]) -> f32 {
    let mut lower = [0u8; 16];
    if token.len() > lower.len() { return 1.0; }
    for (i, b) in token.iter().enumerate() { lower[i] = lower_ascii(*b); }
    let word = &lower[..token.len()];
    const COMMON: [&[u8]; 99] = [
        b"a", b"an", b"the", b"and", b"or", b"but", b"if", b"then", b"of",
        b"to", b"in", b"on", b"at", b"by", b"for", b"from", b"with", b"as",
        b"is", b"are", b"was", b"were", b"be", b"been", b"being", b"it",
        b"its", b"this", b"that", b"these", b"those", b"he", b"she", b"they",
        b"we", b"you", b"i", b"me", b"my", b"our", b"your", b"their", b"not",
        b"do", b"does", b"did", b"done", b"have", b"has", b"had", b"having",
        b"can", b"could", b"will", b"would", b"shall", b"should", b"may",
        b"might", b"must", b"who", b"whom", b"whose", b"what", b"which",
        b"when", b"where", b"why", b"how", b"all", b"any", b"both", b"each",
        b"few", b"more", b"most", b"other", b"some", b"such", b"no", b"nor",
        b"only", b"own", b"same", b"so", b"than", b"too", b"very", b"here",
        b"there", b"again", b"also", b"just", b"about", b"into", b"over",
        b"after", b"before", b"between",
    ];
    if COMMON.iter().any(|candidate| *candidate == word) { 0.05 } else { 1.0 }
}

#[inline]
fn bigram_hash(left: u64, right: u64) -> u64 {
    let combined = left.rotate_left(17) ^ right.wrapping_mul(0x9e3779b97f4a7c15);
    if combined == 0 { 1 } else { combined }
}

// Order-sensitive evidence supplements unigram overlap. It helps distinguish
// answers that repeat the same words but change their relationships.
fn bigram_overlap(truth: &[u8], answer: &[u8]) -> f32 {
    let mut table = [EMPTY_SLOT; TOKEN_TABLE_SIZE];
    let mut truth_weight = 0.0f32;
    let mut cursor = 0usize;
    let mut previous_hash = None;
    let mut previous_weight = 0.0f32;
    while let Some((start, end, next)) = next_token(truth, cursor) {
        let token = &truth[start..end];
        let hash = token_hash(token);
        let weight = token_weight(token);
        if let Some(left) = previous_hash {
            let hash = bigram_hash(left, hash);
            let index = match find_slot(&table, hash) { Some(i) => i, None => return 0.0 };
            if table[index].hash == 0 { table[index].hash = hash; }
            table[index].count = table[index].count.saturating_add(1);
            truth_weight += (previous_weight + weight) * 0.5;
        }
        previous_hash = Some(hash);
        previous_weight = weight;
        cursor = next;
    }

    let mut answer_weight = 0.0f32;
    let mut matched_weight = 0.0f32;
    cursor = 0;
    previous_hash = None;
    previous_weight = 0.0;
    while let Some((start, end, next)) = next_token(answer, cursor) {
        let token = &answer[start..end];
        let hash = token_hash(token);
        let weight = token_weight(token);
        if let Some(left) = previous_hash {
            let pair_hash = bigram_hash(left, hash);
            let pair_weight = (previous_weight + weight) * 0.5;
            answer_weight += pair_weight;
            if let Some(index) = find_slot(&table, pair_hash) {
                if table[index].hash == pair_hash && table[index].count > 0 {
                    table[index].count -= 1;
                    matched_weight += pair_weight;
                }
            }
        }
        previous_hash = Some(hash);
        previous_weight = weight;
        cursor = next;
    }
    if answer_weight <= 0.0 || truth_weight <= 0.0 { return 0.0; }
    (2.0 * matched_weight / (answer_weight + truth_weight)).clamp(0.0, 1.0)
}


// A lightweight polarity guard: lexical overlap alone can reward answers that
// copy the reference while reversing its meaning. This is intentionally
// conservative and deterministic; it is not full natural-language inference.
fn has_negation(bytes: &[u8]) -> bool {
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(bytes, cursor) {
        let token = &bytes[start..end];
        let mut lower = [0u8; 16];
        if token.len() <= lower.len() {
            for (i, b) in token.iter().enumerate() { lower[i] = lower_ascii(*b); }
            let word = &lower[..token.len()];
            if [
                b"not".as_slice(), b"never", b"no", b"without", b"neither",
                b"nor", b"false", b"incorrect", b"wrong", b"cannot", b"cant",
                b"none", b"nobody", b"nothing", b"lacks", b"lack",
            ].iter().any(|candidate| *candidate == word) {
                return true;
            }
        }
        cursor = next;
    }
    // The tokenizer splits contractions at apostrophes, so detect "n't"
    // directly to catch isn't, wasn't, can't, won't, and similar forms.
    let mut i = 0usize;
    while i + 2 < bytes.len() {
        if lower_ascii(bytes[i]) == b'n'
            && bytes[i + 1] == 39
            && lower_ascii(bytes[i + 2]) == b't' {
            return true;
        }
        i += 1;
    }
    false
}

// Detect unsupported numeric claims. Numbers often carry the key factual distinction
// (years, counts, dates, percentages); a mismatching number should not be rescued
// by otherwise copying most of the reference sentence.
fn has_unmatched_number(truth: &[u8], answer: &[u8]) -> bool {
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(answer, cursor) {
        let token = &answer[start..end];
        if !token.is_empty() && token.iter().all(|b| b.is_ascii_digit()) {
            let mut truth_cursor = 0usize;
            let mut found = false;
            while let Some((ts, te, tn)) = next_token(truth, truth_cursor) {
                if &truth[ts..te] == token {
                    found = true;
                    break;
                }
                truth_cursor = tn;
            }
            if !found { return true; }
        }
        cursor = next;
    }
    false
}

fn score_bytes(_question: &[u8], truth: &[u8], answer: &[u8]) -> f32 {
    if answer.iter().all(|b| b.is_ascii_whitespace())
        || truth.iter().all(|b| b.is_ascii_whitespace()) { return 0.0; }

    let mut table = [EMPTY_SLOT; TOKEN_TABLE_SIZE];
    let mut truth_weight = 0.0f32;
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(truth, cursor) {
        let token = &truth[start..end];
        let hash = token_hash(token);
        let index = match find_slot(&table, hash) { Some(i) => i, None => return 0.0 };
        if table[index].hash == 0 { table[index].hash = hash; }
        table[index].count = table[index].count.saturating_add(1);
        truth_weight += token_weight(token);
        cursor = next;
    }

    let mut answer_weight = 0.0f32;
    let mut matched_weight = 0.0f32;
    cursor = 0;
    while let Some((start, end, next)) = next_token(answer, cursor) {
        let token = &answer[start..end];
        let weight = token_weight(token);
        answer_weight += weight;
        let hash = token_hash(token);
        if let Some(index) = find_slot(&table, hash) {
            if table[index].hash == hash && table[index].count > 0 {
                table[index].count -= 1;
                matched_weight += weight;
            }
        }
        cursor = next;
    }

    if answer_weight <= 0.0 || truth_weight <= 0.0 || matched_weight <= 0.0 { return 0.0; }
    // Weighted F1 balances missing reference facts against unsupported extra
    // content. It avoids letting shared filler words dominate the score.
    let unigram_overlap = (2.0 * matched_weight / (answer_weight + truth_weight)).clamp(0.0, 1.0);
    let phrase_overlap = bigram_overlap(truth, answer);
    // Keep lexical coverage dominant to preserve paraphrase tolerance, while
    // using local word order as an additional signal for relational accuracy.
    let overlap = (0.85 * unigram_overlap + 0.15 * phrase_overlap).clamp(0.0, 1.0);

    // V13 adds a modest order-sensitive bigram signal to V11's content-word
    // weighting and V12 calibration. It is a benchmark hypothesis, not a
    // claim that the protocol evaluator will promote this candidate.
    let hit2 = overlap * overlap;
    let hit4 = hit2 * hit2;
    let hit8 = hit4 * hit4;
    let hit10 = hit8 * hit2;
    let hit12 = hit10 * hit2;
    let miss = 1.0 - overlap;
    let miss2 = miss * miss;
    let miss4 = miss2 * miss2;
    let miss8 = miss4 * miss4;
    let miss10 = miss8 * miss2;
    let miss12 = miss10 * miss2;
    let denominator = hit12 + miss12;
    let mut score = if denominator > 0.0 { hit12 / denominator } else { 0.0 };

    // Contradictions must remain low even when most of the reference is copied.
    // Apply strong post-calibration penalties to polarity and numeric conflicts.
    if has_negation(truth) != has_negation(answer) {
        score *= 0.02;
    }
    if has_unmatched_number(truth, answer) {
        score *= 0.05;
    }
    score.clamp(0.0, 1.0)
}

unsafe fn input_slice<'a>(ptr: i32, len: i32) -> &'a [u8] {
    if len <= 0 || ptr == 0 { return &[]; }
    core::slice::from_raw_parts(ptr as *const u8, len as usize)
}

/// ABI: rank_answer(question_ptr, question_len, ground_truth_ptr,
/// ground_truth_len, miner_answer_ptr, miner_answer_len) -> f32.
#[no_mangle]
pub unsafe extern "C" fn rank_answer(
    q_ptr: i32, q_len: i32, gt_ptr: i32, gt_len: i32, ma_ptr: i32, ma_len: i32,
) -> f32 {
    score_bytes(input_slice(q_ptr, q_len), input_slice(gt_ptr, gt_len), input_slice(ma_ptr, ma_len))
}

#[cfg(test)]
mod tests {
    use super::score_bytes;

    #[test]
    fn exact_answer_scores_one() {
        assert_eq!(score_bytes(b"capital?", b"Paris is the capital of France.", b"Paris is the capital of France."), 1.0);
    }
    #[test]
    fn punctuation_and_case_do_not_change_match() {
        assert_eq!(score_bytes(b"q", b"Paris is the capital.", b"PARIS, is the capital!"), 1.0);
    }
    #[test]
    fn unrelated_answer_scores_zero() {
        assert_eq!(score_bytes(b"q", b"Paris is the capital of France.", b"Quantum mechanics explains particles."), 0.0);
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
    fn unrelated_extra_claims_are_penalized() {
        let concise = score_bytes(b"q", b"Paris is the capital of France", b"Paris is the capital of France");
        let padded = score_bytes(b"q", b"Paris is the capital of France", b"Paris is the capital of France and Jupiter has rings");
        assert!(padded < concise);
    }
    #[test]
    fn polarity_reversal_is_heavily_penalized() {
        let truth = b"Paris is the capital of France";
        let reversed = b"Paris is not the capital of France";
        let score = score_bytes(b"q", truth, reversed);
        assert!(score < 0.15, "polarity reversal scored {score}");
    }
    #[test]
    fn matching_negation_is_not_penalized() {
        let truth = b"Paris is not the capital of Germany";
        let answer = b"Paris is not the capital of Germany";
        assert_eq!(score_bytes(b"q", truth, answer), 1.0);
    }
    #[test]
    fn numeric_differences_reduce_score() {
        let truth = b"The population is 1200 in 2020";
        let answer = b"The population is 1200 in 2021";
        assert!(score_bytes(b"q", truth, answer) < 1.0);
    }
    #[test]
    fn numeric_contradictions_are_strongly_penalized() {
        let truth = b"The population was 1200 in 2020";
        let answer = b"The population was 1200 in 2021";
        assert!(score_bytes(b"q", truth, answer) < 0.25);
    }

    #[test]
    fn calibrated_score_keeps_exact_answer_at_one() {
        assert_eq!(score_bytes(b"q", b"Paris is the capital of France", b"Paris is the capital of France"), 1.0);
    }

    #[test]
    fn unrelated_answer_stays_at_zero_after_calibration() {
        assert_eq!(score_bytes(b"q", b"Paris is the capital of France", b"Quantum mechanics explains particles"), 0.0);
    }
    #[test]
    fn odds_calibration_separates_partial_from_strong_overlap() {
        let truth = b"alpha beta gamma delta";
        let weak = score_bytes(b"q", truth, b"alpha beta");
        let strong = score_bytes(b"q", truth, b"alpha beta gamma");
        assert!(strong > weak, "weak={weak}, strong={strong}");
    }

    fn calibrated_score_is_monotonic_with_overlap() {
        let truth = b"alpha beta gamma delta";
        let weak = score_bytes(b"q", truth, b"alpha beta");
        let strong = score_bytes(b"q", truth, b"alpha beta gamma");
        let exact = score_bytes(b"q", truth, truth);
        assert!(weak < strong && strong < exact, "weak={weak}, strong={strong}, exact={exact}");
    }
    #[test]
    fn contractions_with_negation_are_detected() {
        let truth = b"The result is correct";
        let answer = b"The result isn't correct";
        assert!(score_bytes(b"q", truth, answer) < 0.15);
    }

    #[test]
    fn stronger_calibration_preserves_exact_matches() {
        assert_eq!(score_bytes(b"q", b"the answer is forty two", b"the answer is forty two"), 1.0);
    }
    #[test]
    fn unicode_input_does_not_panic() {
        assert_eq!(score_bytes("q".as_bytes(), "東京 is a city 🗼".as_bytes(), "東京 is a city 🗼".as_bytes()), 1.0);
    }
    #[test]
    fn long_inputs_do_not_panic() {
        let truth = "correct answer ".repeat(5000);
        let answer = "correct answer ".repeat(5000);
        assert_eq!(score_bytes(b"q", truth.as_bytes(), answer.as_bytes()), 1.0);
    }
}
