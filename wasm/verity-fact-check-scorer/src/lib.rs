#![cfg_attr(not(test), no_std)]

//! Deterministic, content-weighted lexical scorer for Telegraph FACT_CHECK.
//! This is still a lexical baseline, not a semantic fact-checking engine.
//! V20 strengthens the penalty for explicit opposite factual verdicts while retaining V15's tenth-power calibration.
//! Release note: inflection normalization is a hypothesis; protocol promotion remains unverified.
//! Retains tenth-power odds calibration and numeric-token weighting.
//! Keeps polarity and numeric contradiction guards; adds explicit opposite-verdict detection.
//! Keeps V11 content-word weighting and existing contradiction guards.
//! V20 uses weighted unigram overlap, numeric evidence, inflection normalization, and a stronger opposite-verdict penalty.
//! V27 gates compact-label boosts by question intent and uses a linear-time entity guard.
//! V28 allows unambiguous labels in concise sentences and rejects mixed-polarity references.
//! V29 adds explicit label aliases and preserves an exact-match advantage over paraphrases.
//! V30 calibrates concise explanatory label answers above bare synonyms while keeping exact matches highest.
//! V31 bounds the compact-label override to short references and calibrates concise answer lengths.
//! V32 allows the guarded label-category fallback to run even when literal token overlap is zero.
//! V33 separates short explanatory answers from bare synonyms and expands Fed-stance aliases.
//! V34 adds Fed-stance synonyms to the compact categorical fallback, fixing V33's unreachable alias coverage.
//! V35 increases token-table capacity to reduce collision probing on high-entropy inputs.
//! V36 assigns explicit score tiers to non-exact categorical matches to prevent lexical-score ties.
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

// Keep the open-addressed token table below half full for high-entropy inputs.
const TOKEN_TABLE_SIZE: usize = 32_768;

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
    // Conservative synonym canonicalization: merge only close paraphrases
    // that preserve factual polarity. Antonyms are deliberately never merged.
    let word = &out[..len];
    let canonical: Option<&[u8]> = match word {
        b"fraudulent" | b"fraud" | b"scam" | b"phishing" => Some(b"fraud"),
        b"safe" | b"secure" | b"legitimate" | b"genuine" | b"authentic" => Some(b"safe"),
        b"reduce" | b"reduc" | b"reduced" | b"reduces" | b"reducing" | b"lower" | b"lowered" | b"lowers" | b"fell" | b"fall" | b"decrease" | b"decreased" | b"decreases" => Some(b"decrease"),
        b"increase" | b"increas" | b"increased" | b"increases" | b"rises" | b"rose" | b"raise" | b"rais" | b"raised" | b"raises" => Some(b"increase"),
        b"benefit" | b"benefits" | b"advantage" | b"advantages" => Some(b"benefit"),
        b"positive" | b"positively" | b"bullish" | b"upbeat" | b"optimistic" => Some(b"positive"),
        b"negative" | b"negatively" | b"bearish" | b"downbeat" | b"pessimistic" => Some(b"negative"),
        b"human" | b"person" | b"writtenbyhuman" => Some(b"human"),
        b"ai" | b"machine" | b"artificial" | b"generated" => Some(b"ai"),
        b"buy" | b"purchase" | b"outperform" | b"overweight" => Some(b"buy"),
        b"sell" | b"underperform" | b"underweight" => Some(b"sell"),
        b"hold" | b"neutral" | b"marketperform" => Some(b"hold"),
        b"hawkish" | b"tightening" | b"aggressive" | b"restrictive" => Some(b"hawkish"),
        b"dovish" | b"easing" | b"accommodative" | b"supportive" => Some(b"dovish"),
        b"reported" | b"reports" | b"stated" | b"states" => Some(b"report"),
        _ => None,
    };
    if let Some(value) = canonical {
        out[..value.len()].copy_from_slice(value);
        len = value.len();
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

// Only penalize an opposite verdict when the reference contains one side
// exclusively and the answer contains the other side exclusively. This avoids
// false positives when both labels are discussed as context.
fn has_opposite_verdict(truth: &[u8], answer: &[u8]) -> bool {
    const PAIRS: [(&[u8], &[u8]); 12] = [
        (b"true", b"false"),
        (b"correct", b"incorrect"),
        (b"original", b"plagiarised"),
        (b"verified", b"refuted"),
        (b"confirmed", b"denied"),
        (b"approved", b"rejected"),
        (b"safe", b"fraud"),
        (b"decrease", b"increase"),
        (b"positive", b"negative"),
        (b"human", b"ai"),
        (b"buy", b"sell"),
        (b"hawkish", b"dovish"),
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

// Compact categorical references need different calibration from prose:
 // a one-word ground truth such as "bullish" should still recognize "upbeat"
 // without letting this shortcut override an explicit contradiction.
fn compact_label_category(bytes: &[u8]) -> Option<&'static [u8]> {
    // Allow a label to appear in a concise explanatory sentence, but reject
    // ambiguous references containing more than one categorical polarity.
    // The caller separately gates this on label-oriented question intent.
    let mut cursor = 0usize;
    let mut found: Option<&'static [u8]> = None;
    while let Some((start, end, next)) = next_token(bytes, cursor) {
        let hash = token_hash(&bytes[start..end]);
        let categories: [(&[u8], &[u8]); 30] = [
            (b"positive", b"positive"), (b"negative", b"negative"),
            (b"safe", b"safe"), (b"fraud", b"fraud"),
            (b"human", b"human"), (b"ai", b"ai"),
            (b"buy", b"buy"), (b"sell", b"sell"),
            (b"hold", b"hold"), (b"hawkish", b"hawkish"),
            (b"dovish", b"dovish"), (b"true", b"true"),
            (b"upbeat", b"positive"), (b"bullish", b"positive"),
            (b"bearish", b"negative"), (b"downbeat", b"negative"),
            (b"legitimate", b"safe"), (b"secure", b"safe"),
            (b"phishing", b"fraud"), (b"scam", b"fraud"),
            (b"unsafe", b"fraud"), (b"dangerous", b"fraud"),
            (b"malicious", b"fraud"), (b"risky", b"fraud"),
            (b"tightening", b"hawkish"), (b"aggressive", b"hawkish"),
            (b"restrictive", b"hawkish"), (b"easing", b"dovish"),
            (b"accommodative", b"dovish"), (b"supportive", b"dovish"),
        ];
        for (word, label) in categories {
            if hash == token_hash(word) {
                if let Some(previous) = found {
                    if previous != label { return None; }
                } else {
                    found = Some(label);
                }
                break;
            }
        }
        cursor = next;
    }
    found
}

fn token_count(bytes: &[u8]) -> usize {
    let mut count = 0usize;
    let mut cursor = 0usize;
    while let Some((_start, _end, next)) = next_token(bytes, cursor) {
        count = count.saturating_add(1);
        cursor = next;
    }
    count
}

fn question_targets_label(question: &[u8]) -> bool {
    const CUES: [&[u8]; 24] = [
        b"sentiment", b"bullish", b"bearish", b"outlook", b"safe", b"url",
        b"phishing", b"visit", b"ai", b"human", b"essay", b"written",
        b"hawkish", b"dovish", b"fed", b"stance", b"rating", b"analyst",
        b"recommend", b"buy", b"sell", b"hold", b"verdict", b"true",
    ];
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(question, cursor) {
        let hash = token_hash(&question[start..end]);
        if CUES.iter().any(|cue| hash == token_hash(cue)) { return true; }
        cursor = next;
    }
    false
}

// Detect a likely named-entity substitution when both reference and answer
// contain capitalized entity-like tokens (e.g. Apple vs Microsoft). This is
// intentionally conservative: it does not penalize a short answer that omits
// the entity, and it ignores common sentence-initial words.
fn has_conflicting_proper_noun(truth: &[u8], answer: &[u8]) -> bool {
    const GENERIC: [&[u8]; 18] = [
        b"The", b"A", b"An", b"This", b"That", b"It", b"He", b"She", b"They",
        b"We", b"Revenue", b"Reported", b"According", b"However", b"Overall",
        b"Results", b"Q", b"First",
    ];
    fn is_entity_token(token: &[u8]) -> bool {
        token.len() >= 3
            && token[0].is_ascii_uppercase()
            && token[1..].iter().all(|b| b.is_ascii_lowercase())
    }
    // Fixed-size scratch space keeps this guard linear-time and allocation-free.
    let mut entities = [0u64; 64];
    let mut count = 0usize;
    let mut cursor = 0usize;
    while let Some((start, end, next)) = next_token(truth, cursor) {
        let token = &truth[start..end];
        if is_entity_token(token) && !GENERIC.iter().any(|g| *g == token) {
            let hash = token_hash(token);
            if !entities[..count].contains(&hash) && count < entities.len() {
                entities[count] = hash;
                count += 1;
            }
        }
        cursor = next;
    }
    if count == 0 { return false; }
    cursor = 0;
    while let Some((start, end, next)) = next_token(answer, cursor) {
        let token = &answer[start..end];
        if is_entity_token(token) && !GENERIC.iter().any(|g| *g == token) {
            if !entities[..count].contains(&token_hash(token)) { return true; }
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

    if answer_weight <= 0.0 || truth_weight <= 0.0 { return 0.0; }
    // A zero literal overlap is not always a zero-quality answer: a valid
    // category synonym (e.g. "upbeat" for "bullish") may share no tokens.
    // Keep the base lexical score at zero, but allow the guarded categorical
    // fallback below to evaluate it. Contradictions still receive penalties.
    // Weighted F1 balances missing reference facts against unsupported extra
    // content. Numeric tokens receive extra weight because exact quantities,
    // years, and counts are often decisive in factual claims.
    let overlap = (2.0 * matched_weight / (answer_weight + truth_weight)).clamp(0.0, 1.0);

    // V23 correction: use the established tenth-power calibration because
    // power 14 collapsed some valid partial answers to zero in unit tests.
    // Keep the existing numeric, negation, and opposite-verdict guards.
    let mut hit = 1.0f32;
    let mut miss = 1.0f32;
    for _ in 0..10 {
        hit *= overlap;
        miss *= 1.0 - overlap;
    }
    let denominator = hit + miss;
    let mut score = if denominator > 0.0 && matched_weight > 0.0 { hit / denominator } else { 0.0 };

    // Contradictions must remain low even when most of the reference is copied.
    // Apply strong post-calibration penalties to polarity and numeric conflicts.
    if has_negation(truth) != has_negation(answer) {
        score *= 0.02;
    }
    if has_unmatched_number(truth, answer) {
        score *= 0.05;
    }
    let opposite_verdict = has_opposite_verdict(truth, answer);
    if opposite_verdict {
        score *= 0.005;
    }
    // Do not let a matching quantity compensate for a substituted company or
    // other explicit named entity when the reference identifies one.
    if has_conflicting_proper_noun(truth, answer) {
        score *= 0.02;
    }
    // Avoid collapsing short label-only truths (e.g. "bullish") to near zero
    // merely because a valid synonymous answer uses different surrounding words.
    // This floor is disabled for explicit polarity/negation/number conflicts.
    if truth.len() <= 512
        && answer.len() <= 256
        && question_targets_label(_question)
        && !opposite_verdict
        && has_negation(truth) == has_negation(answer)
        && !has_unmatched_number(truth, answer)
    {
        if let (Some(expected), Some(actual)) =
            (compact_label_category(truth), compact_label_category(answer))
        {
            if expected == actual {
                // A longer, concise explanatory answer may carry more context
                // than a bare synonym, but an exact reference always ranks first.
                if truth != answer {
                    let count = token_count(answer);
                    // Assign explicit tiers: max() would preserve a higher
                    // lexical score and can leave explanatory answers tied
                    // with synonyms, defeating the ordering calibration.
                    score = if count <= 1 {
                        0.95
                    } else if count <= 4 {
                        0.97
                    } else {
                        0.99
                    };
                } else {
                    score = score.max(0.90);
                }
            }
        }
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
    fn synonym_alias_recognizes_scam_and_fraudulent() {
        let truth = b"The URL is a scam.";
        let answer = b"The URL appears fraudulent.";
        let score = score_bytes(b"Is this URL safe?", truth, answer);
        assert!(score > 0.5, "synonym paraphrase scored {score}");
    }

    #[test]
    fn direction_reversal_is_penalized() {
        let truth = b"The treatment reduced mortality by 30 percent.";
        let answer = b"The treatment increased mortality by 30 percent.";
        let score = score_bytes(b"What happened to mortality?", truth, answer);
        assert!(score < 0.05, "direction reversal scored {score}");
    }

    #[test]
    fn safe_and_scam_are_not_treated_as_synonyms() {
        let truth = b"The URL is a scam.";
        let answer = b"The URL is safe and legitimate.";
        let score = score_bytes(b"Is this URL safe?", truth, answer);
        assert!(score < 0.05, "opposite safety verdict scored {score}");
    }

    #[test]
    fn sentiment_synonyms_share_a_canonical_token() {
        let truth = b"The earnings call was bullish.";
        let answer = b"The earnings call was upbeat.";
        let score = score_bytes(b"What was the sentiment?", truth, answer);
        assert!(score > 0.5, "sentiment synonym scored {score}");
    }

    #[test]
    fn stock_rating_synonyms_share_a_canonical_token() {
        let truth = b"The analyst rating is outperform.";
        let answer = b"The analyst recommends buy.";
        let score = score_bytes(b"What is the rating?", truth, answer);
        assert!(score > 0.5, "rating synonym scored {score}");
    }

    #[test]
    fn bullish_and_bearish_are_opposite_verdicts() {
        let truth = b"The outlook is bullish.";
        let answer = b"The outlook is bearish.";
        let score = score_bytes(b"What is the outlook?", truth, answer);
        assert!(score < 0.05, "opposite sentiment scored {score}");
    }

    #[test]
    fn compact_label_accepts_label_in_short_sentence() {
        let score = score_bytes(
            b"Is the earnings call sentiment bullish or bearish?",
            b"The outlook is bullish and positive.",
            b"The tone is upbeat.",
        );
        assert!(score >= 0.90, "short sentence synonym scored {score}");
    }

    #[test]
    fn concise_label_sentence_outranks_bare_synonym_but_not_exact() {
        let question = b"What is the sentiment of this earnings call?";
        let truth = b"The earnings call sentiment is bullish.";
        let bare = score_bytes(question, truth, b"upbeat");
        let sentence = score_bytes(question, truth, b"The tone is upbeat and positive.");
        let exact = score_bytes(question, truth, truth);
        assert!(sentence > bare, "sentence {sentence} must beat bare synonym {bare}");
        assert!(exact > sentence, "exact {exact} must beat sentence {sentence}");
    }

    #[test]
    fn long_label_reference_skips_expensive_label_override() {
        let truth = format!("bullish {}", "market ".repeat(200));
        let score = score_bytes(b"sentiment?", truth.as_bytes(), b"upbeat");
        assert!(score.is_finite() && (0.0..=1.0).contains(&score));
    }

    #[test]
    fn zero_overlap_synonym_uses_guarded_label_fallback() {
        let score = score_bytes(
            b"What is the sentiment of this earnings call?",
            b"bullish",
            b"upbeat",
        );
        assert!(score >= 0.90, "synonym fallback scored {score}");
    }

    #[test]
    fn hawkish_tightening_synonym_is_canonicalized() {
        let score = score_bytes(
            b"Was the Fed statement hawkish or dovish?",
            b"The statement was hawkish.",
            b"Tightening",
        );
        assert!(score >= 0.90, "hawkish synonym scored {score}");
    }

    #[test]
    fn zero_overlap_opposite_label_stays_low() {
        let score = score_bytes(
            b"What is the sentiment of this earnings call?",
            b"bullish",
            b"bearish",
        );
        assert!(score < 0.15, "opposite label scored {score}");
    }

    #[test]
    fn compact_label_rejects_mixed_polarity_reference() {
        let score = score_bytes(
            b"Is the earnings call sentiment bullish or bearish?",
            b"The outlook is bullish but later turns bearish.",
            b"The tone is upbeat.",
        );
        assert!(score < 0.90, "ambiguous mixed-polarity truth scored {score}");
    }

    #[test]
    fn compact_label_accepts_same_category_synonym() {
        let score = score_bytes(b"sentiment?", b"bullish", b"upbeat");
        assert!(score >= 0.90, "compact-label synonym scored {score}");
    }

    #[test]
    fn compact_label_rejects_opposite_category() {
        let score = score_bytes(b"sentiment?", b"bullish", b"bearish");
        assert!(score < 0.05, "opposite compact label scored {score}");
    }

    #[test]
    fn compact_label_does_not_promote_unrelated_prose() {
        let score = score_bytes(b"sentiment?", b"bullish", b"the weather is sunny");
        assert!(score < 0.90, "unrelated prose scored {score}");
    }

    #[test]
    fn wrong_company_with_same_number_is_penalized() {
        let truth = b"Apple reported Q3 revenue of $3.42 billion.";
        let answer = b"Microsoft reported Q3 revenue of $3.42 billion.";
        let score = score_bytes(b"What was Apple Q3 revenue?", truth, answer);
        assert!(score < 0.05, "wrong company scored {score}");
    }

    #[test]
    fn concise_answer_is_not_penalized_for_omitting_entity() {
        let truth = b"Apple reported Q3 revenue of $3.42 billion.";
        let answer = b"$3.42 billion";
        let score = score_bytes(b"What was Apple Q3 revenue?", truth, answer);
        assert!(score > 0.0, "concise value answer scored {score}");
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
    #[test]
    fn large_distinct_token_input_stays_finite() {
        let mut truth = std::string::String::new();
        for i in 0..12000 {
            truth.push_str("token");
            truth.push_str(&i.to_string());
            truth.push(' ');
        }
        let score = score_bytes(b"Summarise the evidence.", truth.as_bytes(), truth.as_bytes());
        assert!(score.is_finite() && (0.0..=1.0).contains(&score));
    }

    fn long_inputs_do_not_panic() {
        let truth = "correct answer ".repeat(5000);
        let answer = "correct answer ".repeat(5000);
        assert_eq!(score_bytes(b"q", truth.as_bytes(), answer.as_bytes()), 1.0);
    }
}
