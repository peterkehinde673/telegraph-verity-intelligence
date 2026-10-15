#![cfg_attr(not(test), no_std)]

//! Deterministic, content-weighted lexical scorer for Telegraph FACT_CHECK.
//! This is still a lexical baseline, not a semantic fact-checking engine.
//! V20 strengthens the penalty for explicit opposite factual verdicts while retaining V15's tenth-power calibration.
//! Release note: inflection normalization is a hypothesis; protocol promotion remains unverified.
//! Retains tenth-power odds calibration and numeric-token weighting.
//! Keeps polarity and numeric contradiction guards; adds explicit opposite-verdict detection.
//! Keeps V11 content-word weighting and existing contradiction guards.
//! V20 uses weighted unigram overlap, numeric evidence, inflection normalization, and a stronger opposite-verdict penalty.
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

// Conservative English morphology normalization makes common inflections
// (for example, "cities"/"city" and "reported"/"report") less likely to be
// treated as entirely different facts. It deliberately avoids broad stemming.
fn normalized_token(token: &[u8], out: &mut [u8; 64]) -> usize {
    let mut len = token.len().min(out.len());
    for i in 0..len { out[i] = lower_ascii(token[i]); }
    if len > 4 && &out[len - 3..len] == b"ies" {
        out[len - 3] = b'y';
        len -= 2;
    } else if len > 5 && &out[len - 3..len] == b"ing" {
        len -= 3;
        if len > 2 && out[len - 1] == out[len - 2] { len -= 1; }
    } else if len > 4 && &out[len - 2..len] == b"ed" {
        len -= 2;
        if len > 2 && out[len - 1] == out[len - 2] { len -= 1; }
    } else if len > 4 && &out[len - 2..len] == b"es" {
        len -= 2;
    } else if len > 3 && out[len - 1] == b's' {
        len -= 1;
    }
    len
}

fn token_hash(token: &[u8]) -> u64 {
    let mut normalized = [0u8; 64];
    let len = normalized_token(token, &mut normalized);
    let mut hash = 0xcbf29ce484222325u64;
    for byte in &normalized[..len] {
        hash ^= *byte as u64;
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
    // Numeric tokens carry unusually high factual value in fact-checking.
    if !token.is_empty() && token.iter().all(|b| b.is_ascii_digit()) { return 2.5; }
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

fn contains_normalized_token(bytes: &[u8], wanted: &[u8]) -> bool {
    let wanted_hash = token_hash(wanted);
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(bytes, cursor) {
        if token_hash(&bytes[start..end]) == wanted_hash { return true; }
        cursor = next;
    }
    false
}

// Conservative guard for two-token capitalized names anywhere in the text.
// It only flags a changed first name when the same second token appears in both
// answers and the candidate does not contain that exact name from the reference.
// Fixed-size buffers bound work for adversarially long inputs.
#[derive(Clone, Copy)]
struct NamePair {
    first: [u8; 64],
    first_len: usize,
    last: [u8; 64],
    last_len: usize,
}
const EMPTY_NAME_PAIR: NamePair = NamePair {
    first: [0; 64], first_len: 0, last: [0; 64], last_len: 0,
};

fn collect_name_pairs(bytes: &[u8], out: &mut [NamePair; 128]) -> usize {
    let mut count = 0usize;
    let mut previous: Option<(usize, usize)> = None;
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(bytes, cursor) {
        if let Some((prev_start, prev_end)) = previous {
            let first = &bytes[prev_start..prev_end];
            let last = &bytes[start..end];
            let capitalized = |token: &[u8]| token.first()
                .map_or(false, |b| *b >= b'A' && *b <= b'Z');
            if capitalized(first) && capitalized(last)
                && first.len() <= 64 && last.len() <= 64 && count < out.len() {
                let mut pair = EMPTY_NAME_PAIR;
                pair.first[..first.len()].copy_from_slice(first);
                pair.first_len = first.len();
                pair.last[..last.len()].copy_from_slice(last);
                pair.last_len = last.len();
                out[count] = pair;
                count += 1;
            }
        }
        previous = Some((start, end));
        cursor = next;
    }
    count
}

fn same_token(left: &[u8], right: &[u8]) -> bool {
    left.len() == right.len() && left.iter().zip(right.iter())
        .all(|(a, b)| lower_ascii(*a) == lower_ascii(*b))
}

fn has_leading_entity_conflict(truth: &[u8], answer: &[u8]) -> bool {
    let mut truth_pairs = [EMPTY_NAME_PAIR; 128];
    let mut answer_pairs = [EMPTY_NAME_PAIR; 128];
    let truth_count = collect_name_pairs(truth, &mut truth_pairs);
    let answer_count = collect_name_pairs(answer, &mut answer_pairs);

    for answer_index in 0..answer_count {
        let candidate = answer_pairs[answer_index];
        let candidate_first = &candidate.first[..candidate.first_len];
        let candidate_last = &candidate.last[..candidate.last_len];
        let mut same_last_seen = false;
        let mut exact_name_seen = false;
        for truth_index in 0..truth_count {
            let reference = truth_pairs[truth_index];
            let reference_first = &reference.first[..reference.first_len];
            let reference_last = &reference.last[..reference.last_len];
            if same_token(candidate_last, reference_last) {
                same_last_seen = true;
                if same_token(candidate_first, reference_first) {
                    exact_name_seen = true;
                    break;
                }
            }
        }
        if same_last_seen && !exact_name_seen {
            return true;
        }
    }
    false
}

// Only penalize an opposite verdict when the reference contains one side
// exclusively and the answer contains the other side exclusively. This avoids
// false positives when both labels are discussed as context.
fn has_opposite_verdict(truth: &[u8], answer: &[u8]) -> bool {
    const PAIRS: [(&[u8], &[u8]); 6] = [
        (b"true", b"false"),
        (b"correct", b"incorrect"),
        (b"original", b"plagiarised"),
        (b"verified", b"refuted"),
        (b"confirmed", b"denied"),
        (b"approved", b"rejected"),
    ];
    for (left, right) in PAIRS {
        let tl = contains_normalized_token(truth, left);
        let tr = contains_normalized_token(truth, right);
        let al = contains_normalized_token(answer, left);
        let ar = contains_normalized_token(answer, right);
        if (tl && !tr && ar && !al) || (tr && !tl && al && !ar) {
            return true;
        }
    }
    false
}

// Experimental factual-anchor coverage: exact numeric tokens, adjacent
// capitalized entity pairs, and explicit verdict terms present in the reference.
// This is a deterministic lexical proxy, not semantic entailment.
// Count numeric evidence only when the question requests the kind of fact
// described by the nearby reference context. This avoids penalizing concise
// answers for omitting unrequested ancillary numbers (e.g. confidence).
fn requested_numeric_anchor(question: &[u8], truth: &[u8], start: usize, end: usize) -> bool {
    // Bound context to the containing sentence so a nearby confidence
    // value cannot inherit the preceding sentence's similarity keywords.
    let mut context_start = 0usize;
    for (i, b) in truth[..start].iter().enumerate() {
        let decimal_point = *b == b'.'
            && i > 0
            && i + 1 < truth.len()
            && truth[i - 1].is_ascii_digit()
            && truth[i + 1].is_ascii_digit();
        if *b == b';' || (*b == b'.' && !decimal_point) {
            context_start = i + 1;
        }
    }
    let mut context_end = truth.len();
    for (i, b) in truth[end..].iter().enumerate() {
        let absolute = end + i;
        let decimal_point = *b == b'.'
            && absolute > 0
            && absolute + 1 < truth.len()
            && truth[absolute - 1].is_ascii_digit()
            && truth[absolute + 1].is_ascii_digit();
        if *b == b';' || (*b == b'.' && !decimal_point) {
            context_end = absolute;
            break;
        }
    }
    let context = &truth[context_start..context_end];

    if contains_normalized_token(context, b"confidence")
        || contains_normalized_token(context, b"probability") {
        return contains_normalized_token(question, b"confidence")
            || contains_normalized_token(question, b"probability");
    }

    if contains_normalized_token(context, b"similarity")
        || contains_normalized_token(context, b"percentage")
        || contains_normalized_token(context, b"percent") {
        return contains_normalized_token(question, b"similarity")
            || contains_normalized_token(question, b"percentage")
            || contains_normalized_token(question, b"percent");
    }

    if contains_normalized_token(context, b"passage")
        || contains_normalized_token(context, b"matches")
        || contains_normalized_token(context, b"matching") {
        return contains_normalized_token(question, b"passage")
            || contains_normalized_token(question, b"matches")
            || contains_normalized_token(question, b"matching")
            || contains_normalized_token(question, b"number")
            || contains_normalized_token(question, b"count");
    }

    if contains_normalized_token(context, b"journal")
        || contains_normalized_token(context, b"source")
        || contains_normalized_token(context, b"reference")
        || contains_normalized_token(context, b"published") {
        return contains_normalized_token(question, b"source")
            || contains_normalized_token(question, b"reference")
            || contains_normalized_token(question, b"year")
            || contains_normalized_token(question, b"date");
    }

    contains_normalized_token(question, b"number")
        || contains_normalized_token(question, b"count")
        || contains_normalized_token(question, b"amount")
        || contains_normalized_token(question, b"year")
        || contains_normalized_token(question, b"date")
        || contains_normalized_token(question, b"score")
        || contains_normalized_token(question, b"confidence")
        || contains_normalized_token(question, b"percentage")
        || contains_normalized_token(question, b"quantity")
        || contains_normalized_token(question, b"value")
        || contains_normalized_token(question, b"when")
}

fn evidence_anchor_coverage(question: &[u8], truth: &[u8], answer: &[u8]) -> f32 {
    let mut total = 0u32;
    let mut matched = 0u32;

    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(truth, cursor) {
        let token = &truth[start..end];
        let numeric = !token.is_empty() && token.iter().all(|b| b.is_ascii_digit());
        if numeric && requested_numeric_anchor(question, truth, start, end) {
            total += 1;
            if contains_normalized_token(answer, token) { matched += 1; }
        }
        cursor = next;
    }

    let mut truth_pairs = [EMPTY_NAME_PAIR; 128];
    let pair_count = collect_name_pairs(truth, &mut truth_pairs);
    let mut question_pairs = [EMPTY_NAME_PAIR; 128];
    let question_count = collect_name_pairs(question, &mut question_pairs);
    let mut answer_pairs = [EMPTY_NAME_PAIR; 128];
    let answer_count = collect_name_pairs(answer, &mut answer_pairs);
    for pair in truth_pairs.iter().take(pair_count) {
        let first = &pair.first[..pair.first_len];
        let last = &pair.last[..pair.last_len];

        // Do not treat a proper-name pair copied from the question (often a
        // document title) as a required answer fact. Keep names found only in
        // the reference as candidate evidence anchors.
        let asked_in_question = question_pairs.iter().take(question_count).any(|qpair| {
            same_token(first, &qpair.first[..qpair.first_len])
                && same_token(last, &qpair.last[..qpair.last_len])
        });
        if asked_in_question { continue; }

        total += 1;
        let found = answer_pairs.iter().take(answer_count).any(|candidate| {
            same_token(first, &candidate.first[..candidate.first_len])
                && same_token(last, &candidate.last[..candidate.last_len])
        });
        if found { matched += 1; }
    }

    const VERDICTS: [&[u8]; 14] = [
        b"true", b"false", b"correct", b"incorrect", b"original", b"plagiarised",
        b"verified", b"refuted", b"confirmed", b"denied", b"approved", b"rejected",
        b"accurate", b"misleading",
    ];
    for verdict in VERDICTS {
        if contains_normalized_token(truth, verdict) {
            total += 1;
            if contains_normalized_token(answer, verdict) { matched += 1; }
        }
    }

    if total == 0 { return 0.0; }
    matched as f32 / total as f32
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
    // content. Numeric tokens receive extra weight because exact quantities,
    // years, and counts are often decisive in factual claims.
    let overlap = (2.0 * matched_weight / (answer_weight + truth_weight)).clamp(0.0, 1.0);

    // V14 returns to the strongest measured calibration (V11, margin 0.3217)
    // after the V13 order signal reduced margin to 0.2818. Numeric-token
    // weighting is a targeted factual-evidence experiment.
    let mut hit = 1.0f32;
    let mut miss = 1.0f32;
    for _ in 0..10 {
        hit *= overlap;
        miss *= 1.0 - overlap;
    }
    let denominator = hit + miss;
    let mut score = if denominator > 0.0 { hit / denominator } else { 0.0 };

    // Blend calibrated lexical overlap with exact factual-anchor coverage only
    // when lexical support is already substantial. This is an experiment to
    // reduce verbosity bias, not a claim of semantic equivalence.
    let anchors = evidence_anchor_coverage(_question, truth, answer);
    if overlap >= 0.45 && anchors >= 0.60 {
        // Cap the bonus to reduce score spread caused by noisy anchor counts.
        // This deliberately tests a fixed ceiling; it is not accepted unless
        // clean-pair consistency improves without hurting adversarial ranking.
        let anchor_bonus = anchors.min(0.80);
        score = (score + (1.0 - score) * anchor_bonus).clamp(0.0, 1.0);
    }

    // Penalize omission of numeric facts only when the question asks for
    // that fact class. Ancillary reference numbers (e.g. unrequested confidence)
    // remain optional; wrong numbers are handled by the conflict guard below.
    let mut cursor = 0usize;
    let mut omitted_requested_number = false;
    while let Some((start, end, next)) = next_token(truth, cursor) {
        let token = &truth[start..end];
        let numeric = !token.is_empty() && token.iter().all(|b| b.is_ascii_digit());
        if numeric
            && requested_numeric_anchor(_question, truth, start, end)
            && !contains_normalized_token(answer, token)
        {
            omitted_requested_number = true;
            break;
        }
        cursor = next;
    }
    if omitted_requested_number {
        score *= 0.05;
    }

    // Contradictions must remain low even when most of the reference is copied.
    // Apply strong post-calibration penalties to polarity and numeric conflicts.
    if has_negation(truth) != has_negation(answer) {
        score *= 0.02;
    }
    if has_unmatched_number(truth, answer) {
        score *= 0.05;
    }
    if has_opposite_verdict(truth, answer) {
        score *= 0.005;
    }
    if has_leading_entity_conflict(truth, answer) {
        score *= 0.005;
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
    use super::{evidence_anchor_coverage, score_bytes};

    #[test]
    fn fact_equivalent_terse_answer_is_calibrated_near_verbatim() {
        let truth = b"The essay is plagiarised. Similarity is 68%, with 7 matching passages from Journal of Coastal Research, 2019.";
        let verbatim = b"The essay is plagiarised. Similarity is 68%, with 7 matching passages from Journal of Coastal Research, 2019.";
        let reworded = b"The essay is plagiarised, with 68% similarity across 7 matching passages traced to Journal of Coastal Research, 2019.";
        let terse = b"plagiarised; 68%; 7 matches; Journal of Coastal Research, 2019.";
        let s1 = score_bytes(b"Verify originality", truth, verbatim);
        let s2 = score_bytes(b"Verify originality", truth, reworded);
        let s3 = score_bytes(b"Verify originality", truth, terse);
        assert!((s1 - s2).abs() <= 0.05, "verbatim/reworded spread: {s1} vs {s2}");
        assert!((s1 - s3).abs() <= 0.05, "verbatim/terse spread: {s1} vs {s3}");
    }

    #[test]
    fn unrequested_confidence_number_is_not_a_required_anchor() {
        let question = b"Report the verdict, similarity percentage, number of matching passages, and matched source.";
        let truth = b"The result is plagiarised. Similarity is 68%, based on 7 matching passages from Journal of Coastal Research, 2019. Confidence is 0.94.";
        let terse = b"plagiarised; 68%; 7 matches; Journal of Coastal Research, 2019.";
        let anchors = evidence_anchor_coverage(question, truth, terse);
        assert!(anchors >= 0.80, "requested-fact anchor coverage too low: {anchors}");
    }

    #[test]
    fn requested_number_omission_is_penalized_but_unrequested_confidence_is_optional() {
        let q = b"What was the reported count?";
        let truth = b"The report recorded 120 cases.";
        let omitted = b"The report discussed the cases.";
        assert!(score_bytes(q, truth, omitted) < 0.10,
            "requested count omission not penalized enough");

        let q2 = b"Report the verdict and matched source.";
        let truth2 = b"The verdict is plagiarised. Confidence is 0.94.";
        let terse = b"The verdict is plagiarised.";
        assert!(score_bytes(q2, truth2, terse) > 0.01,
            "unrequested confidence should not trigger the requested-number omission penalty");
    }

    #[test]
    fn wrong_similarity_percentage_is_penalized() {
        let truth = b"The essay is plagiarised. Similarity is 68%, with 7 matching passages.";
        let wrong = b"The essay is plagiarised. Similarity is 37%, with 7 matching passages.";
        let good_score = score_bytes(b"Verify originality", truth, truth);
        let bad_score = score_bytes(b"Verify originality", truth, wrong);
        assert!(bad_score < good_score * 0.25, "wrong percentage {bad_score}, exact {good_score}");
    }

    #[test]
    fn wrong_source_entity_is_penalized() {
        let truth = b"The essay matches Journal of Coastal Research, 2019.";
        let wrong = b"The essay matches Nature Climate Change, 2016.";
        let good_score = score_bytes(b"Verify source", truth, truth);
        let bad_score = score_bytes(b"Verify source", truth, wrong);
        assert!(bad_score < good_score * 0.25, "wrong source {bad_score}, exact {good_score}");
    }

    #[test]
    fn real_clean_pair_fixture_keeps_terse_answer_near_verbatim() {
        let truth = b"The submitted essay 'Coastal Erosion in Kerala' is assessed as plagiarised. Similarity to the reference corpus is 68%, derived from 7 matching passages against Journal of Coastal Research, 2019. Confidence in this assessment is 0.94.";
        let terse = b"plagiarised; 68% similar; 7 matches; Journal of Coastal Research, 2019.";
        let question = b"Verify the originality of the submitted essay 'Coastal Erosion in Kerala'. Report the verdict, the similarity percentage, the number of matching passages, and the matched source.";
        let exact_score = score_bytes(question, truth, truth);
        let terse_score = score_bytes(question, truth, terse);
        assert!((exact_score - terse_score).abs() <= 0.05,
            "clean-pair near-equality failed: exact={exact_score}, terse={terse_score}");
    }

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
    fn explicit_opposite_verdict_is_heavily_penalized() {
        let truth = b"The essay is plagiarised.";
        let answer = b"The essay is original.";
        let score = score_bytes(b"Verify the essay.", truth, answer);
        assert!(score < 0.05, "opposite verdict scored {score}");
    }

    #[test]
    fn opposite_verdict_penalty_is_stronger_than_generic_negation() {
        let score = score_bytes(
            b"Check authenticity.",
            b"The document is original.",
            b"The document is plagiarised.",
        );
        assert!(score < 0.01, "opposite verdict scored {score}");
    }

    #[test]
    fn verdict_guard_does_not_fire_when_reference_mentions_both_labels() {
        let text = b"The report says the essay is plagiarised rather than original.";
        assert_eq!(score_bytes(b"q", text, text), 1.0);
    }

    #[test]
    fn leading_wrong_person_name_is_heavily_penalized() {
        let truth = b"Maria Chen won the election";
        let answer = b"David Chen won the election";
        let score = score_bytes(b"Who won the election?", truth, answer);
        assert!(score < 0.01, "wrong-person answer scored {score}");
    }

    #[test]
    fn leading_same_person_name_is_not_penalized() {
        let truth = b"Maria Chen won the election";
        let answer = b"Maria Chen was elected";
        let score = score_bytes(b"Who won the election?", truth, answer);
        assert!(score > 0.5, "same-person paraphrase scored {score}");
    }

    #[test]
    fn different_leading_capitalized_phrase_without_shared_second_token_is_not_entity_conflict() {
        let truth = b"The United States signed the agreement";
        let answer = b"The USA signed the agreement";
        let score = score_bytes(b"q", truth, answer);
        assert!(score > 0.5, "possible alias was over-penalized: {score}");
    }

    #[test]
    fn wrong_person_name_inside_sentence_is_penalized() {
        let truth = b"According to the report, Maria Chen won the election";
        let answer = b"According to the report, David Chen won the election";
        let score = score_bytes(b"Who won?", truth, answer);
        assert!(score < 0.01, "sentence-internal wrong person scored {score}");
    }

    #[test]
    fn multi_person_reference_does_not_penalize_a_name_that_is_present() {
        let truth = b"Maria Chen and David Chen both addressed the conference";
        let answer = b"David Chen addressed the conference";
        let score = score_bytes(b"Who addressed the conference?", truth, answer);
        assert!(score > 0.5, "valid entity in multi-person reference scored {score}");
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
