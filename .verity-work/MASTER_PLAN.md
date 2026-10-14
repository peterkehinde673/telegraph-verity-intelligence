# Verity Scoring Improvement — Master Plan (Frozen Baseline)

**Purpose:** Improve the existing Telegraph Verity miner's answer quality and measured per-intent scores, beginning with `DEEPFAKE_DETECTION`, `CONTENT_EXTRACTION`, and `URL_SCAN`, then expanding to the remaining supported intents. The goal is to compete for rank #1 through correct, evidence-grounded, reliable answers—not through score manipulation.

**Plan policy**
- This file is the frozen plan baseline. Do not rewrite or silently change its objectives.
- Track completion in `PROGRESS.md` in this same folder; append/update status there as batches finish.
- Work in small, explicitly reported batches. Do not claim a test ran unless it was actually executed and its result observed.
- Keep candidate changes isolated from production. No miner registration, on-chain transaction, deployment, Render configuration change, or production configuration change.
- Never promise that another miner cannot outrank us or copy public code. Focus on defensible quality, evaluation discipline, operational reliability, and keeping any truly private evaluation material out of the public repository.
- This repository is public: a dot-prefixed/hidden directory is **not secret**. Do not put credentials, API keys, private benchmark answers, or genuinely confidential evaluation cases here. Keep private holdout cases outside GitHub (local-only or an access-controlled private store).

## Baseline and constraints

- Existing miner slug: `telegraph-verity-intelligence`; recorded miner ID: `5530` (verify against live data only when access is available).
- User-provided Explorer screenshot shows active miner at epoch 409, 9 requests served, best rank #2, epochs participated 0, and last scoring at 2026-10-13 11:42:49 PM. Interpret displayed score digits as subscript-style notation as the user specified; never reinterpret them as ordinary decimals.
- First intent batch, in this order: `DEEPFAKE_DETECTION`, `CONTENT_EXTRACTION`, `URL_SCAN`.
- Do not expand intent scope or alter miner registration as part of these batches.
- Protect all existing SSRF defenses and conservative security behavior in URL scanning.
- No code changes are justified until baseline behavior is tested.

## Batch plan

### Batch A — Inspect handlers, response schemas, and tests
- [ ] Read the three intent handlers and their provider contracts.
- [ ] Read the shared response schema/validator and dispatcher wiring.
- [ ] Read all existing focused tests and identify current coverage gaps.
- [ ] Record the exact baseline commit and the commands required to run the tests.

### Batch B — Design evaluation cases
- [ ] Define public/reproducible regression cases for correct, incorrect, ambiguous, empty, malformed, and adversarial inputs for each target intent.
- [ ] Define explicit expected verdict, evidence, uncertainty, and confidence properties.
- [ ] Keep held-out/tuning-resistant cases outside this public repository; never claim cases are private if committed here.
- [ ] Ensure evaluation cases reward factual correctness and evidence quality, not verbosity or unjustified certainty.

### Batch C — Run baseline and document failure modes
- [ ] Execute existing tests from a clean checkout/environment if available.
- [ ] Execute the new evaluation suite before making code changes.
- [ ] Record pass/fail counts, reproducible failures, and baseline metrics per intent.
- [ ] Separate observed test failures from code-review hypotheses.
- [ ] If local execution is unavailable, state the blocker and do not fabricate results.

### Batch D — Implement narrow candidate changes
- [ ] Deepfake detection: validate provider probability semantics, distinguish manipulation probability from confidence in the conclusion, and abstain on missing/contradictory evidence.
- [ ] Content extraction: distinguish successful extraction from completeness, preserve provenance, and avoid assigning confidence 1 merely because non-empty text was returned.
- [ ] URL scan: clearly distinguish HTTP reachability from safety/reputation conclusions; retain public-address validation, DNS/redirect revalidation, bounded redirects, timeouts, and SSRF protections.
- [ ] Add focused regression tests for each changed behavior.
- [ ] Keep each intent change isolated and reviewable; do not combine unrelated refactors.

### Batch E — Compare and accept/reject candidates
- [ ] Run the full existing suite and targeted evaluation suite after each candidate.
- [ ] Compare before/after results on the same cases.
- [ ] Evaluate held-out cases where available and inspect false positives, false negatives, abstention quality, confidence calibration, evidence grounding, and schema compliance.
- [ ] Reject changes that regress security, reliability, or held-out performance.
- [ ] Report actual measurements and limitations; do not infer leaderboard movement from unit tests.

### Batch F — Expand to remaining intents
- [ ] After the first three intents have measured, accepted improvements, rank remaining intents by verified score/rank, traffic, failure rate, and expected impact.
- [ ] Inspect one small batch at a time using the same A–E process.
- [ ] Prioritize the largest verified gaps and protect cross-intent contracts.
- [ ] Continue until all currently supported intents have been evaluated; add new intents only in a separate later plan after the current scope is stable.

### Batch G — Scoring infrastructure and leaderboard verification
- [ ] Inspect the existing FACT_CHECK WASM scorer and build workflow without registering it.
- [ ] Verify local build/test and structural requirements when tooling is available.
- [ ] Treat a successful build as distinct from protocol acceptance, live registration, and score improvement.
- [ ] Retrieve live per-intent score/rank history when an accessible authoritative endpoint is available.
- [ ] Compare screenshot baseline and future observed results with correct score notation.
- [ ] Do not register, deploy, submit transactions, or change production configuration without a separate explicit user request.

### Batch H — Final quality gate and report
- [ ] Run all applicable tests and security regression checks.
- [ ] Review diff for unrelated changes, secrets, hidden evaluation leakage, and unsafe logging.
- [ ] Summarize changes by intent, test evidence, before/after metrics, known limitations, and remaining work.
- [ ] Confirm production, registration, and deployment remain untouched.
- [ ] Recommend next intent batch based on observed evidence, not guesses.

## Acceptance criteria

A candidate improvement is accepted only when:
1. It passes relevant existing tests and new regression cases.
2. It improves a defined quality metric or fixes a demonstrated correctness/security defect without unacceptable regression.
3. It behaves conservatively when evidence is missing or ambiguous.
4. It preserves the response contract and security boundaries.
5. The evidence is reproducible and accurately reported.

Rank #1 is the target, not a guarantee. No implementation can guarantee that competitors never rank higher or never learn from publicly visible code.
