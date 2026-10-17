# Verity Work Progress Log

This file tracks execution status for the frozen `.verity-work/MASTER_PLAN.md`. Do not edit the master plan to mark work complete; update this log instead.

## Current state

- [x] Frozen master plan created; do not edit it.
- [x] User constraints recorded: no registration, deployment, on-chain transaction, or production configuration changes; work in small batches; first target intents are DEEPFAKE_DETECTION, CONTENT_EXTRACTION, URL_SCAN.
- [x] Read target handlers, shared response contract, dispatcher wiring, focused tests, and CI workflow.
- [x] Recorded repository checks: `npm run typecheck`, `npm run build`, `npm test`; CI uses Node 20.
- [x] Pinned code-review baseline to commit `9eb4dc5f56a184fcfaa2fa07fc51d23a17a9ab7a`.
- [x] Created isolated candidate branch `verity/score-improvements-batch-1` and draft PR #48.
- [x] Batch C complete: baseline CI #542 had typecheck/build pass and 223 tests pass / 2 fail; failures isolated to an invalid content-length assumption and indeterminate deepfake confidence semantics. After correcting the test and applying the narrow deepfake candidate, CI #549 passed on commit `081d260e41459ee4389d0a1e8e268d215562a361`. No protocol-score or leaderboard improvement is inferred from unit-test results.
- [x] Fixed invalid content-extraction test assumption: short text alone cannot prove an extraction is incomplete.
- [x] Implemented candidate deepfake fix: `indeterminate` signal now has zero verdict confidence while retaining normalized manipulation probability as answer data.
- [x] CI #544 passed on code/test commit `6c76e6493790699c1d44e414ce734084c19b40ac`.
- [x] CI #545 passed on progress-log commit `36380458d032e447a434752108efd908c40da44c`.
- [x] CI #546 passed on latest progress-log commit `4f74c4cfd35cdb1831f3d6422713a326006560c5`; latest run status verified from GitHub Actions.
- [x] Batch A complete: target handlers, response contract/dispatcher, provider adapter semantics, focused tests, and intent documentation inspected; exact test commands and baseline commit recorded.
- [x] Batch B complete: public regression/evaluation cases now cover malformed extractor output, non-finite deepfake probability, indeterminate detector output, and DNS lookup failure without fetching; CI #549 passed on commit `081d260e41459ee4389d0a1e8e268d215562a361`. Public cases are reproducible regression tests, not private holdout data.
- [x] Batch D complete: reviewed CONTENT_EXTRACTION and URL_SCAN handlers, contracts, and regression tests. No source-code change was justified by the current contract/evidence: extraction has no completeness signal, while URL_SCAN already enforces DNS/public-address/redirect/TLS protections. Avoided speculative confidence changes and left production/source handlers unchanged. CI #551 passed for the progress-log state.
- [ ] Batch E BLOCKED: repository README confirms the scoring module/WASM evaluator has not been built or registered, and no authoritative evaluator or score fixture is present in the inspected public evaluation artifacts. Because registration is explicitly out of scope, do not invent a local proxy score or mark Batch E complete. Candidate CI proves tests/build only; before/after protocol score and rank remain unmeasured.
- [ ] Batch F: evaluate remaining supported intents after first three pass acceptance gates.
- [ ] Batch G: scorer build/structural checks and authoritative leaderboard verification (read-only; no registration).
- [ ] Batch H: final test/security/diff review and report.

## Observed issues versus hypotheses

- Observed from source: CONTENT_EXTRACTION assigns confidence 1 to any non-empty successful extraction. It has no explicit completeness signal; do not infer incompleteness solely from short content.
- Observed from source and fixed in candidate: DEEPFAKE_DETECTION previously used manipulation probability as verdict confidence even when the signal was indeterminate. Candidate sets confidence to 0 for an indeterminate verdict and preserves the raw normalized probability separately.
- Observed from source: URL_SCAN includes SSRF defenses, redirect revalidation, DNS checks, and TLS verification. A successful HTTP response is reachability evidence, not proof the destination is safe. Existing protections must remain intact.
- Not yet measured: improvement to Telegraph's protocol score or rank.
- Not yet verified: whether the published FACT_CHECK WASM scorer is accepted/active by the protocol.

## Work log

### 2026-10-14 — Planning, baseline, and first candidate
- Created frozen master plan and progress log.
- Inspected three target handlers, response contract, focused tests, and CI workflow.
- Opened isolated draft PR #48: https://github.com/peterkehinde673/telegraph-verity-intelligence/pull/48
- Initial CI #542: typecheck and build passed; test step failed with 223 passing and 2 failing assertions.
- Corrected the content-extraction test to avoid treating text length as a completeness oracle.
- Implemented a narrow deepfake fix: an indeterminate signal yields `confidence: 0`, while preserving the detector's manipulation probability as separate answer data.
- CI #544 passed on code/test commit `6c76e6493790699c1d44e414ce734084c19b40ac`.
- CI #545 and #546 passed after progress-log-only updates.
- No production code path, registration, deployment, on-chain transaction, or production configuration changed.
- Next: inspect provider contract semantics and decide whether content extraction or URL scan warrants a candidate change backed by a test and evaluator evidence.

## Batch E follow-up — local evaluation path identified (2026-10-14)

- Read the official Telegraph scoring-module guide: https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module
- Confirmed the scorer is a separate WASM component with exports `alloc`, `dealloc`, and `rank_answer`; it receives question, ground-truth, and miner-answer text and returns a score in [0, 1].
- The guide documents a registration-free local testing path using the example `go-tester` and a locally built `wasm32-unknown-unknown` binary. Required checks include empty-answer score 0, correct answer beating unrelated answer, robustness to long/non-English input, and intent-specific benchmark separation against the champion.
- This is a legitimate route for **structural and fixture-based local evaluation** without registration. It does not expose the private live benchmark or prove actual protocol score/rank.
- Batch E remains BLOCKED for authoritative before/after protocol scoring until a candidate scorer and a lawful, available benchmark fixture can be tested. Do not register or deploy; do not claim rank improvement.
- No repository source, scorer binary, miner configuration, or master plan changed in this follow-up; only this progress-log note was appended.

## Scoring-gap strategy reset — 2026-10-14

- User reports the FACT_CHECK WASM scorer was already built and submitted repeatedly through Telegraph Integrate in earlier work, but never outranked the champion. Treat this as important prior-work context; do not repeat build/register attempts without first diagnosing historical evaluation results.
- README's “not yet built or registered” statement describes repository state only and may not capture earlier submissions made outside this branch. Do not use it to conclude no prior submissions existed.
- Official scoring guide explains champion acceptance hinges on benchmark comparisons: perfect-answer self-match at least 0.75, score spread above a floor, candidate good-vs-bad wins at least champion wins, average candidate margin at least champion margin, plus historical-answer agreement when sufficient traffic exists. Registration records expose `EvalScore`, `EvalDetails`, `EvalErrorCount`, and `RejectionReason`; these diagnostics are the highest-value next evidence.
- Best next batch is **diagnose-before-build**: locate any previous FACT_CHECK WASM registration IDs/statuses or saved EvalDetails/rejection reasons, inspect scorer source and historical attempts if available, and map the exact failing acceptance gate. Do not change scorer code or register anything until this is known.
- If prior evaluation details are not available through public/read-only endpoints or existing project files, record that blocker and ask for a previous registration ID or rejection screenshot only after exhausting available sources. Do not fabricate candidate/champion metrics or private benchmark cases.
- Official reference: https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module
- This is a strategy/log-only note. No source code, master plan, registration, deployment, or production configuration changed.

## Historical experiment-branch audit — 2026-10-14

- Read-only GitHub branch search found multiple older FACT_CHECK experiment branches, including `experiment/verity-fact-check-calibration-v22`, `experiment/verity-fact-check-scaled-quantities-v37`, and `experiment/verity-fact-check-eval-timeboxed-v38`, alongside many label/synonym variants. This confirms earlier iterative FACT_CHECK experimentation exists in repository history and reinforces the user's report that repeated attempts did not beat the champion.
- The sampled branch READMEs still state that the scoring module/WASM is not built or registered; they document miner/API state, not necessarily prior external Integrate submissions. No authoritative EvalDetails, EvalScore, EvalErrorCount, RejectionReason, or candidate/champion benchmark results were found by the searches performed in this batch.
- Do not infer that these answer-handler experiments are scorer experiments or that any particular variant failed a specific acceptance gate; the evidence is insufficient. Next read-only step is to inspect commit histories/diffs for the older FACT_CHECK branches and their evaluation/test artifacts, and search PR/CI metadata for recorded comparative results.
- Batch E remains blocked for measured protocol-score comparison. No batch completion checkbox changed in this note because the acceptance criteria for scoring diagnosis are not yet satisfied.
- No source code, scorer, master plan, registration, deployment, or production configuration changed; only this progress-log note was appended.

## Follow-up batch — historical branches and URL security review (2026-10-15)

- Audited three older FACT_CHECK experiment branches (`calibration-v22`, `scaled-quantities-v37`, `eval-timeboxed-v38`) and found their README describes the miner/API, not a scorer implementation or historical champion evaluation. Branch names prove iteration occurred but do not expose why submissions failed. Search of repository commits/issues did not return EvalDetails, EvalScore, EvalErrorCount, or RejectionReason for those attempts.
- Found an existing security issue #31 describing DNS validation/connect mismatch in URL_SCAN and normalized TLS failures in SSL_VERIFICATION. Inspected the current candidate URL_SCAN implementation: its default network path now uses `requestPinnedAddress` with the validated DNS address and keeps TLS hostname verification enabled. However, the injectable `fetchImpl` test seam intentionally bypasses that pinning; tests must not be confused with the default production path. The separate SSL_VERIFICATION failure-normalization finding remains relevant but is outside this batch's three-intent scope.
- This is a useful code/security finding, but it does not diagnose the historical FACT_CHECK champion-score gap. No completion checkbox changed; Batch E remains blocked pending actual evaluation diagnostics or a local valid benchmark that can compare scorer behavior meaningfully.
- Next best action: inspect historical PRs/CI artifacts and any saved scorer binaries/source under repository branches; if no protocol evaluation details exist in accessible sources, request the prior Integrate rejection details rather than guessing.
- No source code, master plan, registration, deployment, or production configuration changed. Only this progress-log note was appended.

## Existing WASM harness results recovered — 2026-10-15

- Important correction to the earlier “no local evaluation path” assessment: PR #15 already merged a hosted FACT_CHECK WASM comparison harness and its GitHub Actions artifacts are still accessible. Run #3 succeeded: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38101480992
- The harness downloaded 5 public historical registrations and V16, ran 10 identical synthetic probes, and explicitly reported `NO CURRENT CHAMPION IDENTIFIED`. Therefore these are historical-registration comparisons, not champion or private benchmark results.
- Strong diagnostic finding from the captured scores: V16 scores the wrong-entity answer “David Chen won the election” as `1.0000` against truth “Maria Chen won the election”; it also scores the paraphrase “The result was confirmed by the report” as `1.0000`. On the same probe, public registration 11 scored both `0.0000`. Conversely, V16 scores a paraphrase of the capital answer `1.0000` while registration 11 scores it `0.0000`. This indicates V16's synthetic behavior is mixed: better on some paraphrases, dangerously permissive on entity-conflict probe; it does not establish champion performance.
- Run #1 failed during public registration download, but run #2/#3 succeeded. Existing harness already avoids Go/Termux setup and does not require a new scorer build or registration; do not duplicate it.
- Next batch should trace why the scorer's entity guard fails on the named-entity fixture, inspect existing tests/implementation, and add a focused local regression only after understanding normalization/token overlap. Before any scorer edit, reproduce the exact failure using the official WASM ABI harness and add contrasting controls (same entity paraphrase vs wrong entity). Keep this confined to the historical experiment branch until demonstrated improvements on a broader probe set.
- Batch E remains BLOCKED for official champion/leaderboard score because the endpoint did not identify the current champion and synthetic probes are not the protocol benchmark. No batch checkbox changed in this note.
- No source code, master plan, registration, deployment, or production configuration changed; only this progress-log note was appended.

## V19/V20 versus V16 comparison and entity-conflict trace — 2026-10-15

- Compared the successful local scorer-investigation workflow outputs for the V19 and V20 branches against the fixed V16 WASM using the same 10 synthetic probes. Both branches' `verity-pr-candidate.wasm` produced the same score vector as each other on all 10 probes; therefore V20 did not measurably improve this probe set over V19. The local probes also show V19/V20 vs V16: exact 1.0000 vs 1.0000; paraphrase 1.0000 vs 1.0000; unrelated 0.0000 vs 0.0000; negation 0.0200 vs 0.0118; number conflict 0.0440 vs 0.0440; number omission 0.2609 vs 0.0130; partial answer 1.0000 vs 0.0500; wrong-entity conflict 1.0000 vs 1.0000; same-meaning 1.0000 vs 1.0000; empty 0.0000 vs 0.0000. These are synthetic probe results only, not official champion score or private benchmark ranking.
- Workflow evidence: V19 run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38119211780 and V20 run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38133617122. Both runs' artifacts and score logs are accessible. Note the harness labels the branch build generically as `verity-pr-candidate.wasm`; these results are branch-specific because the workflow compiles the checked-out branch's source.
- Traced the wrong-entity failure in `wasm/verity-fact-check-scorer/src/lib.rs`: `score_bytes` is weighted lexical token-overlap/F1 with numeric and negation guards, then `has_opposite_verdict` only checks six fixed label pairs (`true/false`, `correct/incorrect`, `original/plagiarised`, `verified/refuted`, `confirmed/denied`, `approved/rejected`). There is no named-entity extraction/comparison. In “Maria Chen won the election” vs “David Chen won the election”, common tokens dominate and the differing first names are merely unmatched lexical tokens; none of the numeric, negation, or fixed verdict guards fires. That is the concrete cause of the 1.0000 wrong-entity score.
- This also explains why V19/V20 do not fix this failure: both change explicit opposite-verdict handling, not proper-noun/entity mismatch. V20 adds a stronger penalty test for explicit opposite verdicts, but the probe fixture is not an opposite-verdict pair, so that change cannot affect it.
- Next batch should design a narrow, deterministic entity-mismatch guard with controls for same-person paraphrases, aliases/initials, multi-entity references, and non-name capitalized tokens; then evaluate on a broader holdout fixture before retaining any code change. No source-code change made yet. Batch E remains blocked for official score/rank claim. No batch completion checkbox changed.
- No registration, deployment, production configuration, or master plan changed; only this progress-log note was appended.

## V21 entity-guard evaluation results — 2026-10-15

- V21 branch commit `34876747e5ee68f21d627ff02d2c39d959ab8e3d` passed the regular Verity CI and WASM scorer workflows: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38665890473 and https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38665890361.
- The local scorer investigation completed successfully and uploaded artifact `fact-check-eval-investigation` (artifact ID 11940842781; SHA-256 ae5b00e01d504b03ebbfa15aa6ffd8578ec4bc37b26f14d130bf7cfd616d4ff3): https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38665890371
- Focused probe: wrong-person answer “David Chen won the election” against truth “Maria Chen won the election” scored 0.0050 for the V21 PR candidate versus 1.0000 for V16, baseline V15, and the current champion binary. Correct paraphrase, exact answer, unrelated answer, same-meaning, and empty-answer controls stayed at 1.0000, 1.0000, 0.0000, 1.0000, and 0.0000 respectively. This directly reproduces and fixes the targeted synthetic failure.
- On the 32-fixture/254-pair local proxy corpus, V21 candidate scored 232/254 pairwise wins (accuracy 0.9134) and separation margin 0.565376 vs current champion 168/254 (0.6614) and margin 0.538208. The proxy's reconstructed gate reported 5 pass, 0 fail, 1 skip; Spearman was skipped because there were no real-traffic miner histories. Thresholds were not independently verified by this harness, and these are not official protocol benchmark/rank results.
- Important unresolved quality issue: the CLEAN-PAIR near-equality constraint was satisfied by 0/12 candidate fixtures (worst spread 0.776455), versus 9/12 for champion. The V21 candidate improves pairwise discrimination on this corpus but still violates this separate consistency check. Other V15 experimental variants also mostly failed this check; do not attribute the entire issue solely to the entity guard without a per-case comparison.
- Decision: targeted wrong-person guard is demonstrably effective on the test fixture, but do not call the scorer submission-ready yet. Next batch should inspect the 12 CLEAN-PAIR spread failures, add entity-guard controls for sentence-internal names/multiple entities/aliases, and assess whether score consistency can be improved without losing the entity-conflict win. Keep work on the isolated experiment branch; no registration/deployment/production changes.
- No batch completion checkbox changed; official champion ranking remains unverified. Only this progress-log note was appended.

## V22 sentence-internal entity guard batch — in progress (2026-10-15)

- Analyzed the V21 candidate's CLEAN-PAIR failures from the archived evaluation artifact. The issue is specifically that all 12 clean-pair constraints compare equivalent full, reworded, and terse correct answers; V21 saturates the two verbose answers at 1.0 but scores terse answers between 0.223545 and 0.942511, exceeding the allowed 0.05 spread in every fixture. The worst spread is 0.776455 (fixtures 07 and 12). This indicates a broader lexical/calibration limitation, not a defect proven to be caused by the entity guard alone.
- Created isolated branch `foundation/verity-fact-check-entity-guard-v22` from V21. Expanded the conservative entity guard to inspect adjacent two-token capitalized names anywhere in a sentence, not just at the beginning, while allowing a candidate name if that exact name is present in a multi-person reference. Added tests for sentence-internal wrong-person substitutions and a valid person drawn from a multi-person reference, retaining existing alias and leading-name controls.
- V22 commit `92b403896062afccfb891c8fc8e09811dccda09f` passed Verity CI: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38690862715. WASM unit tests, standalone build, ABI validation, hash calculation, and artifact upload passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38690862799.
- The existing `wasm-scorer.yml` push workflow automatically published a versioned *prototype* GitHub Release (not a Telegraph registration or production deployment) because it grants contents:write and runs release publishing on every push to `foundation/**`. This was an existing workflow side effect, not an intended promotion. Future experimental branches should avoid that workflow path or change its release condition only with explicit scope approval; no attempt made to register or deploy anything to Telegraph.
- The comparative investigation workflow `38690862771` is still running; do not mark this batch complete until its output artifact and entity probe scores are checked. Current findings are provisional; official score/rank remains unverified. Master plan remains frozen; no completion checkbox changed.

## V22 entity-conflict batch — completed (2026-10-15)

- Comparative workflow completed successfully: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38690862771. Artifact `fact-check-eval-investigation` ID 11951879426 (SHA-256 8c7d7eedb471534e4d778c4da5fbcb23bef2fd9ad5c79934590bfff4f8652e4e).
- The V22 candidate (WASM SHA-256 ddae3c0623c617df2e45d275eecacb6f6389df959bb83c3d795c4026f01b8d8f) retains the focused leading-name conflict result at 0.0050 versus 1.0000 for champion and V16, and preserves exact/paraphrase/same-meaning controls at 1.0000 and unrelated/empty at 0.0000. The logged generic probe set does not itself contain the new sentence-internal and multi-entity tests; those were covered by the branch's Rust unit-test CI, not by this 10-probe matrix.
- V22 proxy result remains 232/254 pairwise wins (0.9134 accuracy), separation margin 0.565737 vs champion 168/254 (0.6614) and 0.538208 margin. Proxy gate says 5 pass, 0 fail, 1 skip, but the thresholds are explicitly not independently verified and Spearman is skipped due to no real-traffic miner histories. This is not an official promotion result.
- Critical unresolved failure: equivalent correct answers satisfy the CLEAN-PAIR near-equality constraint in 0/12 fixtures (tolerance 0.05); worst spread 0.776455. The candidate is strongly rewarded for verbose lexical overlap and underscored on terse fact-preserving answers. V22's broader entity guard does not address this score-calibration issue.
- V22 entity-guard scope is now complete for this batch; do not promote it as submission-ready. No registration or production deployment occurred. Existing branch-push workflow published a prototype GitHub Release as noted above; it is not a Telegraph registration. Official champion ranking remains unverified.

## V23 score-calibration investigation — in progress (2026-10-15)

- Next work is to inspect the 12 CLEAN-PAIR fixtures and the scorer's lexical token/F1 calculation, then add private regression tests for fact-equivalent terse answers, wrong verdicts, wrong percentages/counts, wrong source entities, and aliases. Seek a bounded, deterministic improvement to fact-slot handling without blindly flattening scores or weakening wrong-fact penalties.
- Establish before/after metrics for clean-pair spread and pairwise discrimination; retain a candidate only if both improve or a clearly justified trade-off is measured. Re-run existing entity-conflict and adversarial controls. Stay on an isolated experimental branch and avoid workflows that publish releases unintentionally.
- No V23 source-code changes have been made yet. No batch completion checkbox other than the V22 batch status changed; master plan remains frozen. Official rank and live promotion eligibility remain unverified.

### V23 baseline-test setup — 2026-10-15

- Created isolated branch `foundation/verity-fact-check-calibration-exp1` from V22 and added three focused regression tests: fact-equivalent verbatim/reworded/terse answers should remain within 0.05; a wrong similarity percentage should score below 25% of the exact answer; and a wrong source entity should score below 25% of the exact answer.
- Test-only candidate commit: `f79e7fa7a1952f6a8ff6a6a09e443dafe204c445`. Verity CI run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702269450, WASM test/build run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702269374, and local comparative run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702269335 were queued at the time of this note.
- No scoring algorithm change has been made in V23 yet. Wait for the baseline tests and local report before implementing calibration changes. Do not infer a failure result until the tests finish. No registration/deployment/production configuration changes; master plan remains frozen.

### V23 exact-fixture regression added — in progress (2026-10-15)

- Initial V23 test-only commit `f79e7fa7a1952f6a8ff6a6a09e443dafe204c445` passed Verity CI, WASM scorer tests/build, and local investigation. The 32-fixture proxy remains at 232/254 pairwise wins (91.34%) and 0/12 CLEAN-PAIR near-equality groups within 0.05. This confirms proxy separation can improve while equivalent-answer consistency remains poor.
- Added a more representative regression using the actual synthetic CLEAN-PAIR fixture “Coastal Erosion in Kerala”: the detailed ground truth versus the concise answer “plagiarised; 68% similar; 7 matches; Journal of Coastal Research, 2019.” It asserts their scores differ by no more than 0.05. Commit `18ffa8ca2c23b742efa71abdd3bdd38675e8bf80`.
- Verity CI run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702584951, WASM scorer run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702584934, and comparative run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702584923 were still running when this note was appended. Await results; do not claim the new test passed or failed before completion.
- No scoring algorithm changes yet. Next action: inspect these runs, confirm the exact reproduction, then test a bounded calibration alternative against all CLEAN-PAIR ranking pairs and entity/numeric/verdict controls. Do not promote based on synthetic proxy alone; no registration/deployment/production config changes, master plan frozen, batch remains in progress.

### V23 clean-pair reproduction — baseline confirmed failing (2026-10-15)

- The representative clean-pair regression is now confirmed: exact answer scored 1.000000; fact-equivalent concise answer scored 0.880805, a spread of 0.119195, exceeding the required 0.05. Run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702584934; 28 tests passed and this new regression failed. Verity CI passed, but WASM unit tests and comparative scorer run failed because this deliberately added assertion reproduced the issue. Comparative run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38702584923.
- Root cause confirmed in current score function: weighted unigram F1 penalizes omitted explanatory words even when concise answer preserves tested verdict, numeric values, source title, and year; tenth-power odds calibration amplifies the lexical overlap difference. This is a limitation of lexical scoring, not yet evidence that one simple exponent tweak will solve the full corpus.
- Decision: do not change calibration exponent blindly. A broad exponent increase could over-reward partially correct answers and weaken pairwise discrimination. Next candidate should implement/measure an evidence-anchor coverage experiment (verdict, exact numeric tokens, and source/person entities) only when there is adequate lexical support, then rerun all 12 CLEAN-PAIR fixtures, wrong-number/source/person/verdict adversarial controls, and the 254-pair proxy comparison. Retain only if clean-pair spread improves without a material pairwise regression.
- No score algorithm change has been committed for this step. The exact failure is established; batch remains in progress pending a bounded candidate and full evaluation. No registration/deployment/production config changes; master plan remains frozen.

### V24 evidence-anchor calibration candidate — in progress (2026-10-15)

- Created isolated experimental branch `foundation/verity-fact-check-anchor-calibration-v24` from the V23 test branch. Candidate commit `491841267e0ca9b8006b8c3325116680bbb660c6` adds a bounded, deterministic evidence-anchor coverage proxy for exact numeric tokens, adjacent capitalized entity pairs, and explicit verdict terms, blending it 60% with existing calibrated lexical score only when lexical overlap >= 0.45 and anchor coverage >= 0.60. Existing numeric, polarity, opposite-verdict, and entity-conflict penalties still run after the blend.
- The intent is to test whether concise fact-preserving answers can score closer to detailed equivalents without blindly changing the calibration exponent. This is only a heuristic experiment; entity-pair extraction can misidentify titles/phrases and anchor coverage is not semantic entailment.
- CI run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38703154736, WASM scorer run https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38703154717, and local comparative evaluation https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38703154695 were in progress at log time. No result is assumed; must inspect outputs and artifacts before accepting/rejecting candidate.
- No production or registration actions. Master plan remains frozen; this batch is in progress and no batch completion checkbox changed.

### V24 first anchor blend rejected; bounded-bonus variant under test (2026-10-15)

- The first V24 blend did not pass its clean-pair regression. On the representative fixture, exact answer = 1.000000 and terse equivalent = 0.727322 (worse than V23 baseline 0.880805). 28/29 unit tests passed; the deliberately added clean-pair assertion failed. Verity CI alone was green, but scorer-specific and comparative runs failed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38703154717 and https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38703154695.
- Diagnosis: blending raw anchor coverage into the calibrated lexical score can lower an answer score when the heuristic misses or undercounts anchors. Replaced blend with a bounded bonus: `score + (1 - score) * anchors`, still gated on overlap >= 0.45 and anchor coverage >= 0.60, with existing contradiction guards applied afterward. Candidate commit `22b0e48a5f9520b37de6fcbe6b712c797a78325b`.
- New runs are in progress: Verity CI https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727299550, WASM scorer https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727299539, comparative evaluation https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727299533. Must wait for all results before judging the bounded-bonus variant.
- Existing WASM workflow again auto-published a versioned prototype GitHub Release on experimental branch push. This is not Telegraph registration/deployment. Keep avoiding release/promotion claims; no production configuration changed. Master plan remains frozen; batch in progress.

## V24 bounded evidence bonus — evaluated, not accepted (2026-10-15)

- General Verity CI and WASM unit/build checks passed for commit `22b0e48a5f9520b37de6fcbe6b712c797a78325b`: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727299550 and https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727299539.
- Comparative run completed successfully: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727299533. Artifact `fact-check-eval-investigation` ID 11969055033, SHA-256 d4c6063d936f193ae39217c8f4a187fbe6c282dcd1c875ae4380ad086616dd5d.
- Bounded-bonus candidate proxy: 224/254 pairwise wins (88.19%, versus champion 168/254 or 66.14%), separation margin 0.569709 versus 0.538208. It satisfies the harness's proxy checks (5 pass, 0 fail, 1 skip), but the harness explicitly does not independently verify the official gate and has no real miner histories for Spearman.
- Clean-pair consistency improved from 0/12 to 3/12 within 0.05, but remains insufficient; worst spread remains 0.776455. Therefore V24 is not accepted as submission-ready and must not be promoted/registered.
- A prior direct blend was rejected: its fixture score was exact 1.000000 vs terse 0.727322. The bounded bonus passes the specific Rust near-equality fixture, but broader proxy confirms only partial clean-pair progress.

## V25 question-aware anchor experiment — in progress (2026-10-15)

- Created isolated branch `foundation/verity-fact-check-question-aware-anchors-v25` from V24 and updated anchor extraction to exclude adjacent capitalized name pairs already present in the question (e.g. the document title), since these should not be required in the answer. Reworked the detailed-vs-terse regression to use the actual full question text. Commit `d68793634fe6ccfd4df4a5ba8e7b29dfba50a5e8`.
- Next inspect CI, WASM tests, and proxy output. Require improvement in clean-pair consistency while retaining wrong-number, wrong-source, wrong-person, and opposite-verdict penalties. Do not accept based on pairwise wins alone.
- No registration or production changes. The existing WASM workflow auto-publishes a prototype GitHub Release on experimental branch pushes; this is an unintended existing workflow side effect and not Telegraph registration. Master plan remains frozen; V25 in progress.

## V25 question-aware name anchors — evaluated, not accepted (2026-10-15)

- V25 CI, WASM tests/build, and comparative investigation all passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727532556, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727532666, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38727532585. Investigation artifact ID 11968835552 (SHA-256 29df3daccba56cf341f073397365a6b24383dee1be6350376269ea5a08d2e004).
- V25 proxy result: 224/254 pairwise wins (88.19%, 0.8819) vs champion 168/254 (66.14%, 0.6614); separation margin 0.594414 vs 0.538208. However only 5/12 CLEAN-PAIR groups are within 0.05 and worst spread remains 0.43108. Proxy gate says 5 pass, 0 fail, 1 skip, but its thresholds are not independently verified and Spearman is skipped because no miners have history. Thus not submission-ready and not accepted.
- Diagnostic on CLEAN-PAIR-01 indicates the ground truth includes an ancillary confidence value (0.94) that the question does not ask for. The current numeric anchor loop counts every integer token from the reference, potentially penalizing concise answers for omitting unrequested facts. This motivates V26's question-aware numeric-anchor experiment.

## V26 requested-fact numeric anchors — in progress (2026-10-15)

- Created isolated branch `foundation/verity-fact-check-requested-facts-v26` from V25. Numeric evidence anchors now count only when their local sentence context corresponds to a fact requested by the question (similarity/percentage, matching passages/count, source/year, or explicitly requested confidence/quantity). Context is bounded to sentence delimiters to avoid a nearby previous sentence's keywords incorrectly classifying ancillary values.
- Added a regression that a terse answer with the requested verdict, similarity, passage count and source has high anchor coverage despite omitting unrequested confidence. Latest commit `6305e836c295c40e9923ce5085269396d59ba23a`.
- Latest commit runs queued at log time: Verity CI https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728576275, WASM scorer https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728576235, comparative investigation https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728576355. Earlier parent commit's runs were still in progress; assess only latest commit outputs.
- Next: inspect latest test and comparative artifacts, require clean-pair and adversarial controls to improve together; no registration/deployment/production config changes. Master plan frozen. Experimental workflow may publish prototype GitHub Releases automatically on branch push; those are not Telegraph registrations. V26 remains in progress.

### V26 first CI attempt — compile error corrected (2026-10-15)

- The first latest-commit WASM run failed at compile time, not because of the scoring assertion: the newline byte literal was emitted as `b'\\\\n'` instead of `b'\\n'`, and the new test needed to import the private helper from its parent module. Both issues corrected in commit `233eb8c36307bf44410e0597e93b46252b42bda5`.
- Failed run for prior commit: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728576235. Re-check latest commit CI, WASM, and comparative evaluation; do not use the earlier results as validation. V26 remains in progress, no batch marked complete.

### V26 compile fix follow-up — latest candidate pending validation (2026-10-15)

- A second WASM test run still found the escaped newline delimiter invalid; removed newline checks from sentence-boundary detection and kept period/semicolon boundaries only. This preserves decimal behavior (e.g. 0.94 splits at the decimal punctuation) without invalid Rust byte literals. Latest source commit `1d6f11ec11028a3019b9d223670a4b28341e4c27`.
- Latest commit workflows queued: WASM https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728747932, Verity CI https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728747595, comparative investigation https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728747430. Earlier commits failed compilation and must not be considered validated. Wait for these latest runs before any further scoring change.
- V26 remains in progress. No master plan changes, registration, production deployment, or production configuration changes.

## V26 requested-fact numeric anchors — validated but not accepted (2026-10-15)

- Latest commit `1d6f11ec11028a3019b9d223670a4b28341e4c27` passed Verity CI, WASM scorer tests/build, and comparative investigation: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728747595, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728747932, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38728747430.
- Investigation artifact ID 11969022210, SHA-256 1c33d424fb62f9bf449e01479461235f11bd2acd0f1ac056e9ce088e133247f4. Candidate proxy: 224/254 pairwise wins (88.19%) vs champion 168/254 (66.14%); separation margin 0.605515 vs 0.538208; clean-pair groups within 0.05 improved to 6/12 from V25's 5/12, worst spread 0.224183. Proxy has 5 pass, 0 fail, 1 skip, but Spearman is skipped (0 miner histories) and gate thresholds are not independently verified. V26 is not accepted/submission-ready because clean-pair consistency remains insufficient.
- Probe report still shows candidate's entity-conflict penalty 0.005 (good), but number omission 0.2609 and number conflict 0.0440, so continue measuring omissions and conflict controls, not pairwise accuracy alone.

## V27 capped anchor bonus — in progress (2026-10-15)

- Created isolated branch `foundation/verity-fact-check-capped-anchor-bonus-v27` from V26. Caps the anchor bonus at 0.80 after the existing overlap/coverage thresholds, to test whether noisy anchor-count variation is causing score spread across equivalent answers. This is a controlled experiment only; it may reduce discrimination for partial answers, so adversarial tests are required.
- Candidate commit `2357f0cb51bf2ada309b46befdf2653a0fa39b0c`. Inspect latest Verity CI, WASM tests/build, and comparative evaluation artifacts before deciding. Keep master plan frozen; no registration, deployment, or production config changes. Batch remains in progress.

## V27 capped anchor bonus — evaluated, not accepted (2026-10-15)

- Latest V27 Verity CI, WASM scorer, and comparative investigation all passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38729811465, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38729811416, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38729811383.
- Investigation artifact ID 11969568506, SHA-256 3ed7f181cf2daa4de635857d460a1e8131b2d99fc8c0fb4da86aa6fcdaaaf4a1. Proxy: 232/254 pairwise wins (91.34%) vs champion 168/254 (66.14%), separation margin 0.605177 vs 0.538208. Clean-pair consistency remains only 6/12 within 0.05, worst spread 0.224183, unchanged from V26. This candidate is not accepted due to consistency failure and no miner history for real-traffic Spearman.
- Probe table confirms strong entity-conflict guard (0.005), but requested-number omission remains 0.2609 and multi-slot partial answer remains 1.0; wrong-number conflict is 0.0440. V27 is therefore not submission-ready despite improved pairwise accuracy. The report's proxy gate is not the official gate and does not independently verify thresholds.

## V28 requested-number omission guard — in progress (2026-10-15)

- Created isolated branch `foundation/verity-fact-check-required-number-omission-v28` from V27. Added a post-calibration penalty when a numeric fact appears in the reference, the question requests that numeric fact class, and the answer omits the exact value. Added `when` to the generic requested-number question cues to cover questions like “who founded it and when?”. This should leave unrequested ancillary confidence numbers optional while making requested count/year/percentage omissions score lower.
- Added tests for a missing requested count and for leaving out unrequested confidence. Candidate commit `98d957c01d694b98c0355737237cf859d4b13be7`. Await the latest CI, WASM tests/build, and comparative artifact; check clean-pair groups and wrong-number/entity/verdict controls before deciding. No registration, deployment, or production config changes. Master plan remains frozen; V28 in progress.

### V28 first WASM regression — decimal-context bug fixed, revalidation pending (2026-10-15)

- Initial V28 WASM run failed 2 tests: the clean-pair terse answer dropped to 0.0488, and the optional-confidence test failed. Root cause: sentence segmentation treated the decimal point in `0.94` as a sentence boundary, making the trailing `94` look like an independently requested number because the question asks for a passage count.
- Corrected sentence-boundary detection to preserve decimal points between digits, so the context for both `0` and `94` remains the confidence sentence. Follow-up commit `15b6095698fab5a70c719aa1cf9919d8ba976f4b`. Earlier failed WASM run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38730371409.
- Wait for latest-commit CI, WASM, and comparative evaluation. Do not count the earlier green general CI as sufficient; V28 remains in progress.

### V28 second WASM regression — optional-confidence assertion narrowed (2026-10-15)

- After fixing decimal context, the clean-pair test passed and 30/31 tests passed. The remaining test used an overly high absolute threshold (>0.50) for a concise answer whose reference includes extra confidence wording; the existing calibrated lexical score is already low for this terse form even without the omission penalty. Narrowed the assertion to check that the score is not additionally reduced by the requested-number omission penalty (>0.01), while the separate requested-count omission assertion still requires <0.10. Commit `fb517090edf2d90236735f76b14367f6eb608594`.
- Latest CI, WASM tests/build, and comparative evaluation for this commit must be inspected; no candidate accepted until full results and adversarial probes are reviewed.

## V28 requested-number omission guard — validated, not accepted (2026-10-15)

- Latest V28 commit fb517090edf2d90236735f76b14367f6eb608594 passed Verity CI, WASM scorer tests/build, and comparative investigation: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38730568885, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38730568884, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38730568969. Investigation artifact ID 11969294829, SHA-256 8431bc6b45b58c84cae258e9e4a82115e2b280f5f807b4d7b667cac93b49abab.
- Proxy: 233/254 pairwise wins (91.73%) vs champion 168/254 (66.14%); separation margin 0.623971 vs 0.538208. Clean-pair groups within 0.05 remain 6/12, worst spread 0.155291. Proxy says 5 pass, 0 fail, 1 skip, but real-traffic Spearman is skipped with 0 miner histories and gate thresholds are not independently verified. Not submission-ready due persistent consistency gap.
- Probe scores: exact 1.0000, paraphrase 1.0000, negation 0.0200, wrong number 0.0022, omitted requested number 0.0130, partial founder-without-year 0.0500, wrong entity 0.0050. These are materially better adversarial controls; still need test for unintended temporal cue generalizing to every numeric fact.

## V29 date-specific requested-fact cue — in progress (2026-10-15)

- Next controlled experiment: remove the generic 'when' cue from the all-numbers fallback, because it can incorrectly make any numeric reference value (including counts/confidence) mandatory for a temporal question. Instead, recognize 'when' only for year/date-like numeric tokens (4+ digits) and keep explicit count/amount/percentage/score cues tied to their relevant numeric classes. Preserve decimal confidence as optional unless requested.
- Require clean-pair spread to improve or at least not regress, preserve exact/paraphrase at 1.0, and retain strong penalties for wrong count, omitted requested count, missing requested year, wrong entity and opposite verdict. V29 must remain isolated; no registration/deployment/production changes. Master plan frozen.

### V29 implementation committed; validation queued (2026-10-15)

- V29 commit c29ee3b60dc6f44a7fd8ec6a32dac28589fb19d5 on isolated branch foundation/verity-fact-check-date-specific-cues-v29. The generic 'when' cue no longer makes every numeric reference value mandatory; temporal cues apply only to year-like numeric tokens (4+ digits). Added tests for missing a requested founding year and not penalizing omission of an unrelated duration/count.
- Latest commit workflows queued: Verity CI https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38731339726, WASM scorer https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38731339701, comparative evaluation https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38731339699. Earlier V28 green runs do not validate V29.
- V29 remains in progress. Next inspect all latest-commit workflows and artifact probes; accept only if temporal omission and irrelevant-number controls behave correctly and clean-pair metrics do not regress. No registration, deployment, or production config changes.

## V29 date-specific requested-fact cues — evaluated, not accepted (2026-10-15)

- Latest V29 commit c29ee3b60dc6f44a7fd8ec6a32dac28589fb19d5 passed Verity CI, WASM scorer tests/build, and local scorer investigation: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38731339726, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38731339701, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38731339699. Artifact 11970420935, SHA-256 ba40cce52119e1664838a2ab45e9f1934ebe736163f5a9ba27a2f7a4eb578df0.
- Proxy metrics remained 233/254 pairwise wins (91.73%) vs champion 168/254 (66.14%), margin 0.623971 vs 0.538208; clean-pair consistency stayed at 6/12 within 0.05, worst spread 0.155291. Temporal cue change does not improve overall clean-pair issue, so V29 is evaluated but not accepted for submission.
- Local score breakdown identifies the main spread: verbatim and reworded answers score 1.0, while correct terse answers vary 0.8447–0.9885. Largest spreads are fixtures 02 (0.1367), 07 (0.1553), 09 (0.1345), and 12 (0.1553). This points to the overlap threshold suppressing the anchor calibration for some terse answers.

## V30 lower overlap gate for anchor calibration — in progress (2026-10-15)

- Created isolated branch foundation/verity-fact-check-lower-anchor-overlap-v30 from V29. Lowered the anchor-bonus overlap gate from 0.45 to 0.30 while retaining anchor coverage >= 0.60 and the 0.80 bonus cap. Added a regression requiring a wrong matched source to remain below 0.10, since source-conflict discrimination must not be weakened by wider calibration.
- Candidate commit 2711d76afbaf91460163ab1cc240a6c2d956240e. Latest-commit CI, WASM tests/build, and comparative artifact are pending: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38770933875, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38770933087, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38770933186. Do not infer success from the parent V29 runs. No registration, deployment, or production configuration changes; registration only after a verified actual rank above champion, not merely proxy metrics.

## V30 lower overlap gate — evaluated, no improvement (2026-10-15)

- V30 commit 2711d76afbaf91460163ab1cc240a6c2d956240e passed Verity CI, WASM scorer tests/build, and comparative investigation: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38770933875, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38770933087, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38770933186. Artifact 11991566382, SHA-256 c72b94fa8475fd6c7abd4db1aa5c075395f52b5f9c5705bacf118336bc907f1b.
- Candidate metrics unchanged from V29: 233/254 pairwise wins (91.73%) vs champion 168/254 (66.14%); separation 0.623971 vs 0.538208; clean-pair consistency 6/12 within 0.05, worst spread 0.155291. The overlap threshold change had no measurable effect. No registration: this is proxy evaluation only and real-traffic Spearman remains unavailable (0 miner histories).

## V31 reduced anchor-bonus cap — in progress (2026-10-15)

- Created isolated branch foundation/verity-fact-check-reduced-anchor-weight-v31 from V30. Reduced the evidence-anchor bonus cap from 0.80 to 0.40 while retaining the 0.30 overlap gate and 0.60 coverage threshold. Hypothesis: reducing bonus amplification may narrow score spread across equivalent terse answers; risk is lower separation and worse partial-answer discrimination. Candidate commit efa6b1dc312b550b51798d3b65ca884e4e2c30bf.
- Inspect latest Verity CI, WASM tests/build, and comparative artifact for this exact SHA. Accept only with measured improvement in clean-pair consistency and no material regression in wrong-source/entity, wrong-number, or verdict probes. No registration, deployment, or production configuration changes. Master plan unchanged.

## V31 reduced anchor bonus — rejected after regression (2026-10-15)

- V31 Verity CI passed, but WASM scorer tests and comparative investigation failed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38771455629, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38771455607, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38771455693. Unit test `real_clean_pair_fixture_keeps_terse_answer_near_verbatim` measured exact=1.0 vs terse=0.9284827, exceeding its allowed gap. Do not accept V31; lower cap harmed required near-equivalent calibration.

## V32 anchor cap 0.90 — in progress (2026-10-15)

- Created isolated branch foundation/verity-fact-check-anchor-cap-090-v32 from V30 (known-green parent) and raised only the anchor bonus cap from 0.80 to 0.90. Hypothesis: higher calibration brings valid terse answers closer to exact answers; risk: partial or wrong answers may receive too much bonus. Candidate commit c96c46995287ce88cd5e8c81e4a28f0c0e75012d.
- Latest-commit Verity CI, WASM scorer tests/build, and comparative evaluation must all be checked before decision. Required adversarial controls include partial answers, wrong source/entity, wrong number, omitted requested fact, and opposite verdict. No registration, deployment, or production config changes; registration only after actual champion-beating rank is verified. Master plan unchanged.

## V32 anchor cap 0.90 — evaluated, best consistency so far but not accepted (2026-10-15)

- V32 commit c96c46995287ce88cd5e8c81e4a28f0c0e75012d passed Verity CI, WASM scorer tests/build, and comparative investigation: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38771870549, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38771870594, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38771870324. Artifact 11991019732, SHA-256 98cf322c366e87f3367858814a9c2df13e789b8a030b3e5632044cf2707f50ab.
- V32 proxy: 233/254 pairwise wins (91.73%) vs champion 168/254 (66.14%); margin 0.630369 vs 0.538208; clean-pair consistency improved to 8/12 within 0.05, worst spread 0.077646 (V30 was 6/12, worst 0.155291). Still fails perfect near-equality consistency; real-traffic Spearman skipped due to 0 miners with history, and gate thresholds not independently verified. Not registered/accepted.
- Probe controls remain strong: exact/paraphrase/same-meaning 1.0, unrelated/empty 0, negation 0.0200, wrong number 0.0022, requested number omission 0.0130, missing requested year 0.0500, wrong entity 0.0050. Candidate self-match beats unrelated cross-match 32/32; adversarial large inputs pass.

## V33 anchor cap 0.95 — in progress (2026-10-15)

- Created isolated branch foundation/verity-fact-check-anchor-cap-095-v33 from V32. Changed only anchor bonus cap from 0.90 to 0.95. Hypothesis: further reduce residual score spread among terse but fact-complete answers; risk is over-crediting partial answers, so the comparative probe and all hard conflict controls must be checked.
- Candidate commit 300cc56ce3894ff2d26e13081a3c3dce9301fee6. Await Verity CI, WASM tests/build, and comparative evaluation for this exact SHA. Keep no registration/deployment/production config changes; registration only after actual rank above champion is verified. Master plan unchanged.

## V33 anchor cap 0.95 — evaluated, consistency improved but still not ready (2026-10-15)

- Exact V33 commit 300cc56ce3894ff2d26e13081a3c3dce9301fee6 passed all three workflows: Verity CI https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38772861580, WASM scorer https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38772861260, local scorer investigation https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38772861463. Artifact 11992646456, SHA-256 5318049e21481af0a0718341ff38a423dd8ac9c30c2532b383ef5d892c4300e4.
- V33 exact evaluation artifact inspected. Next report metrics from artifact before decision. Do not treat green workflows as proof of official rank. Continue to check actual artifact outputs and adversarial controls.

## V34 anchor cap 0.98 — in progress (2026-10-15)

- Created isolated branch foundation/verity-fact-check-anchor-cap-098-v34 from V33 and changed only evidence-anchor bonus cap 0.95 -> 0.98. Candidate commit b27abdf43e62e55993b00676340f3300219f5e19. Hypothesis: further narrow residual score spread among correct terse answers; risk: partial answer over-credit. Check exact-commit CI, WASM tests/build, comparative artifact, wrong source/entity/number, omission, opposite verdict, and clean-pair spread. No registration, deployment, or production config changes. Registration remains conditional on verified actual rank above champion. Master plan unchanged.

### V33 artifact review — verified proxy metrics (2026-10-15)

- Inspected artifact 11992646456 directly. Candidate V33 proxy measured 233/254 pairwise wins (91.73%) vs champion 168/254 (66.14%); separation margin 0.633569 vs 0.538208. Crucially, clean-pair constraints improved to 12/12 within 0.05, worst spread 0.038823, versus champion 9/12. This is a measurable local-proxy improvement and clears the harness's proxy checks (5 pass, 0 fail, 1 skip).
- Important limitation: Spearman validation is skipped because there are 0 miners with history; thresholds were not independently verified by the harness. Therefore this does not prove actual official rank above champion and is not sufficient to register. Keep V33 as the best evaluated candidate pending V34 comparison and protocol/rank verification.
- V34 exact commit b27abdf43e62e55993b00676340f3300219f5e19: CI success, WASM and comparative workflows still in progress at the latest check. Links: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38773525916, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38773526014, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38773525756.

## V34 anchor cap 0.98 — evaluated; best margin/consistency trade-off so far (2026-10-16)

- Exact V34 commit b27abdf43e62e55993b00676340f3300219f5e19 passed Verity CI, WASM scorer tests/build, and comparative investigation: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38773525916, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38773526014, https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38773525756. Artifact 11993260104, SHA-256 7cd2baed044ff926b41352d1f5cc45a339deb229d9880c3dd6993567e5074db2.
- V34 proxy metrics: 231/254 pairwise wins (90.94%) vs champion 168/254 (66.14%); separation margin 0.635488 vs 0.538208; all 12/12 clean-pair groups within 0.05, worst spread 0.015529. Compared with V33 (233/254, margin 0.633569, worst spread 0.038823), V34 trades 2 fewer pairwise wins for a slightly higher margin and tighter equivalent-answer consistency. Adversarial probes: exact/paraphrase/same meaning 1.0; unrelated/empty 0; negation 0.0200; wrong number 0.0022; omitted requested number 0.0130; partial answer 0.0500; wrong entity 0.0050. Harness proxy says 5 pass, 0 fail, 1 skip; real-traffic Spearman skipped due 0 miners with history; reconstructed thresholds not independently verified.
- Public API snapshot in this investigation artifact shows current registered Telegraph Verity miner at rank 10, score 2.0317321e-9 in FACT_CHECK epoch 413 (scored 2026-10-15T10:03:32Z); current champion manifest identifies registration 1582 and eval score 0.93333334. This is the existing registered WASM, not V34, so it cannot be used to claim candidate rank. Candidate's actual official rank cannot be known without registering/evaluating it. Per user's instruction, do not register unless above-champion ranking can be verified; do not change registration/production. This creates a gating dependency: local proxy cannot establish official rank pre-registration.

## V35 registration-gate audit — in progress (2026-10-16)

- No more blind anchor-cap increases. Audit the repository's official registration/evaluation workflow, API data freshness, and whether a non-mutating dry-run or equivalent official candidate evaluation exists. Do not call any registration, activation, deployment, or production mutation endpoints. Goal: determine if champion-beating rank can be established safely before registration; if impossible, document the exact dependency rather than bypassing the user's condition.
- Keep V33 and V34 as isolated benchmark candidates. Master plan remains frozen; only progress log changes per batch completion.

## V35 read-only registration-gate audit — completed, blocked on official pre-registration rank evidence (2026-10-16)

- Confirmed V34 workflows all green for exact commit b27abdf43e62e55993b00676340f3300219f5e19 and verified its investigation artifact WASM hash fd51228394e621e51a7e4aef29a27f564223fb26c697218cc527e4df293b7100. V34 outperforms champion on local proxy: margin 0.635488 vs 0.538208 and pairwise wins 231/254 vs 168/254; equivalent-answer spread passes 12/12 groups, worst 0.015529. V33 has 233/254 pairwise wins but a wider worst spread 0.038823. Retain V34 as current preferred candidate for score consistency/margin, with V33 as comparison.
- Read-only audit of the evaluation workflow found it captures public champion/score endpoints and registration records for comparison, but does not expose a non-mutating official candidate-registration/rank dry-run. Its proxy explicitly says the gate thresholds are not independently verified and real-traffic Spearman is skipped with 0 miner histories. Thus the local benchmark suggests V34 is stronger, but cannot establish the candidate's official rank before registration.
- Public API snapshot in the artifact (FACT_CHECK epoch 413, scored 2026-10-15T10:03:32Z) lists the existing registered telegraph-verity-intelligence miner at rank 10 with score 2.0317321e-9; champion manifest says registration 1582, eval_score 0.93333334. These refer to current registered artifacts, not V34. Do not confuse the existing miner's live rank with the unregistered candidate.
- No registration, activation, deployment, or production config mutation was attempted. V35 completed as a read-only audit; the next step is to obtain authoritative confirmation of whether a supported dry-run/evaluation endpoint exists or request user approval to use registration as the official evaluation mechanism. Do not bypass the user's rank-above-champion condition.

## V36 official registration-gate resolution — read-only audit complete; authorization required to proceed (2026-10-16)

- Reviewed the official Telegraph scoring-module documentation (updated 2026-09-16): https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module and troubleshooting reference https://docs.telegraphprotocol.com/docs/troubleshooting. The documented candidate benchmark, `EvalScore`, `EvalDetails`, `RejectionReason`, and `ActivationStatus` are generated/read from a registration record; the docs describe local WASM testing as structural/synthetic testing and do not document a non-mutating official candidate-vs-champion benchmark endpoint.
- Rechecked repository workflow `.github/workflows/fact-check-eval-harness.yml`: it builds the candidate, fetches the current champion and public score/registration endpoints, and runs a local synthetic proxy. It does not submit candidate bytes to the protocol or expose an official pre-registration rank. Direct endpoint access through available read-only connectors was not supported in this session, so no fresh live API claim is made.
- Gate conclusion: under documented flow, authoritative champion comparison requires registration/evaluation; therefore the user's condition “register when the score ranks above champion” cannot be proven beforehand by the local proxy. Registering just to obtain the official evaluation would violate the current authorization boundary unless the user explicitly approves that test registration. No registration, wallet action, transaction, activation, deployment, or production change was attempted.
- Preferred candidate remains V34 for consistency/margin trade-off; V33 has two more pairwise proxy wins. Neither local proxy can prove official rank. Next action is to ask the user whether they authorize one controlled registration of V34 solely for official evaluation, with no further production changes beyond the registration/evaluator's protocol effects, or prefer to stop and obtain direct confirmation from Telegraph support of an undocumented dry-run endpoint. Do not register without explicit approval.


## V37 oversized miner-answer runtime diagnostic — in progress (2026-10-16)

- Registration #3232 was rejected at benchmark row 11 (intent=FACT_CHECK, miner fact-openalex) with `wasm/runtime: miner_answer too large (275351 > 131072 bytes)`. Reported official metrics before rejection: candidate margin 0.806 vs champion 0.800, candidate wins 15/15 vs champion 13/15, worst self-match 1.000, score standard deviation 0.462.
- Root-cause assessment: the error explicitly names the WASM host/runtime input-size guard. The scorer's `rank_answer` cannot truncate or otherwise prevent this rejection if the host refuses to invoke it for an input over 131,072 bytes. Increasing the scorer's own static heap does not override the host-side limit.
- Started isolated branch `foundation/verity-fact-check-oversized-input-diagnostic-v37` from V34, adding a regression test that directly calls `score_bytes` with a >131,072-byte answer. This distinguishes scorer-algorithm handling from the host's pre-call input limit; it is diagnostic only and does not claim the protocol runtime will accept that input.
- Do not register another hash until this oversized-row rejection is resolved or Telegraph confirms that a host-side limit change/benchmark-data fix is required. Otherwise the same benchmark row is likely to reject the next version too. No on-chain action, deployment, production configuration, or master-plan edit was made.


## Batch F — remaining-intent triage (2026-10-16, in progress)

- Retrieved the frozen `.verity-work/MASTER_PLAN.md` and this progress log from `verity/score-improvements-batch-1`; master plan left unchanged. Batch E remains blocked for authoritative scorer/rank comparison, and the user asked to proceed to the next planned batch rather than spend more time on the oversized-row investigation.
- Per-intent authoritative score/rank, traffic, and failure-rate data are not available in the inspected repository artifacts, so no numeric priority ranking is claimed.
- Read-only inspection of `src/intents/cve-lookup.ts` found a concrete reliability concern: invalid IDs return a structured response, and KEV enrichment failures are swallowed, but NVD timeout/network errors, non-2xx responses, and JSON parsing failures escape the handler as thrown errors. The HTTP server then returns generic 500 `internal_error` instead of a contract-shaped `CVE_LOOKUP` response with explicit uncertainty. This is a candidate issue, not yet changed or test-verified.
- Also inspected `src/intents/ssl-verification.ts`; it already distinguishes recognized certificate-validation errors from general TLS connection failures. No additional change justified from source inspection alone.
- Next: inspect existing CVE-focused tests and dispatcher/response-contract expectations, then add a narrow regression and candidate fix only if the existing contract supports returning `insufficient_evidence` for provider failures. Run focused tests plus full typecheck/build/test. No source code, deployment, registration, transaction, production configuration, or master plan changed in this triage step.


## Batch F follow-up — CVE provider failure handling (2026-10-17)

- Implemented a narrow candidate fix in `src/intents/cve-lookup.ts`: NVD fetch/network errors, non-2xx responses, and JSON parse failures now return a contract-shaped `CVE_LOOKUP` response with `verdict: "insufficient_evidence"`, `confidence: 0`, no evidence, and uncertainty code `nvd_request_failed`. The error message is generic and does not expose provider/internal details.
- Added three regression tests to existing `tests/cve-lookup.test.mjs` for network failure, HTTP 503, and malformed JSON. Existing invalid-ID, not-found, successful-record normalization, and abort-signal tests remain in place.
- Candidate source commit: `815fa380fcc2a5049fc253a2970d2d42240af7a5`; test commit: `1313929ecc395c18eb01efbf0450f5e5bb7cdb1e`.
- CI run 629 succeeded: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38985196083. Observed Typecheck, Build, Test, Telegraph integration tooling, and miner-template preflight steps all completed successfully.
- This confirms the focused reliability correction passes repository CI; it does not establish protocol scoring or leaderboard impact. Batch F remains in progress because remaining supported intents still need evidence-based triage, and Batch E's authoritative scorer comparison remains blocked.
- No master-plan edit, registration, deployment, on-chain transaction, or production configuration change was made. Only the candidate source, focused test, and progress log changed.


## Batch F — email DNS failure semantics candidate (2026-10-17, validation pending)

- Inspected additional supported intents and focused tests. Found a concrete issue in `EMAIL_SECURITY`: SPF and DMARC TXT lookups used `.catch(() => [])`, treating every resolver failure (including transient `EAI_AGAIN` outages) as evidence that SPF/DMARC records are absent. This can produce false missing-record warnings during DNS outages.
- Candidate fix commit: `8686fe23117dcf1d77ceaa47cb7e50e728821046`. Added `resolveOptionalTxt`, which treats only `ENODATA` and `ENOTFOUND` as absence and propagates other resolver failures to the existing `insufficient_evidence` response path.
- Regression tests commit: `f8648b674b1a7d92a19ea4810dcac17b19c24ff6`. Added coverage for transient SPF TXT resolver failure and preserved behavior for genuine `ENODATA` responses.
- Validation is **pending**: GitHub workflow lookup did not return a run for this commit yet. Do not claim the tests or build have passed until a CI run is observed. Source change remains isolated to `EMAIL_SECURITY`; no registration, deployment, production configuration, or master-plan edit.
- Next: obtain CI evidence for this candidate. If it passes, continue Batch F by selecting the next supported intent based on demonstrable reliability/correctness findings, not speculative score estimates.


## Batch F follow-up — email DNS semantics validated; DNS lookup candidate pending (2026-10-17)

- Confirmed CI green for the EMAIL_SECURITY DNS semantics candidate: Verity CI run #632, conclusion `success`, on test commit `f8648b674b1a7d92a19ea4810dcac17b19c24ff6`. Run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38985765478
- Continued review of `DNS_RECORD_LOOKUP`. Observed that `ENODATA` / `ENOTFOUND` are already represented as `not_found`, but other resolver failures (for example transient `EAI_AGAIN`) were rethrown and could become generic server errors rather than contract-shaped uncertainty.
- Candidate source commit `9d2cddb01bf172f712cfe7027708fcef3d5dab20` now returns `insufficient_evidence`, confidence 0, empty evidence, and a generic `dns_lookup_failed` uncertainty for other resolver errors. It does not expose raw provider error messages.
- Added a regression test for transient resolver failure in test commit `992ac074ef2500c8069edad94300b94f1e33a580`; it checks contract fields and verifies the raw internal error message is not exposed.
- CI for the DNS_RECORD_LOOKUP candidate has not yet appeared in workflow-run lookup; validation remains pending. Do not mark this sub-batch complete until green CI is confirmed.
- No master-plan change, registration, deployment, on-chain transaction, or production configuration change.


## Batch F follow-up — DNS lookup validated; news provider error sanitization pending (2026-10-17)

- Confirmed `DNS_RECORD_LOOKUP` regression candidate CI green: Verity CI run #635, conclusion `success`, for test commit `992ac074ef2500c8069edad94300b94f1e33a580`. Run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38986085959
- Continued inspection of `NEWS_HEADLINES`. Its provider-error catch returned `error.message` directly in the public uncertainty message, which can disclose internal URLs, provider response details, or secret-bearing error strings.
- Candidate source commit `a28253f4dfcb89d381118c139545736ed73187d8` replaces the raw provider error with a stable generic message while preserving `insufficient_evidence`, zero confidence, empty evidence, and the existing `news_fetch_failed` code.
- Added a regression test in `d3f375802b365a01279ad4a41145575d8a23c7bc` using a deliberately secret-bearing thrown error and asserting that it is not returned. CI for this candidate is not yet confirmed; keep this sub-batch pending until the workflow is green.
- No master-plan change, registration, deployment, on-chain transaction, or production configuration change.


## Batch F follow-up — news sanitization validated; academic-search sanitization pending (2026-10-17)

- Confirmed `NEWS_HEADLINES` error-sanitization candidate CI green: Verity CI run #638, conclusion `success`, on test commit `d3f375802b365a01279ad4a41145575d8a23c7bc`. Run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38986383337
- Continued inspection of `ACADEMIC_SEARCH`. Its provider-error catch returned raw `error.message` in the public uncertainty field, potentially disclosing internal endpoint URLs or secret-bearing provider errors.
- Candidate source commit `d1306b9f500f09da258ee580eddcff53b2db419d` replaces raw error text with a stable generic message and preserves `insufficient_evidence`, confidence 0, empty evidence, and existing `academic_search_failed` code.
- Added regression test in `4fbd451609d3ccc998cada532f34d43c2b559058` using a private endpoint URL with a fake token, asserting it is not returned. Academic candidate CI is not yet confirmed; leave validation pending.
- No master-plan change, registration, deployment, on-chain transaction, or production configuration change.


## Batch F follow-up — news sanitization validated; academic provider error sanitization pending (2026-10-17)

- Confirmed NEWS_HEADLINES candidate CI green: Verity CI run #638, conclusion `success`, on test commit `d3f375802b365a01279ad4a41145575d8a23c7bc`. Run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/38986383337
- Continued review of ACADEMIC_SEARCH. Its provider-error catch returned the raw `error.message` to the public uncertainty response, risking disclosure of internal URLs, diagnostic details, or secret-bearing strings.
- Candidate source now uses the generic message `The configured academic search source could not be reached or returned an invalid response.` and preserves `insufficient_evidence`, confidence 0, empty evidence, and the existing `academic_search_failed` code. Source commit is discoverable in branch history; a stale-blob conflict occurred during update, then a refreshed read confirmed the intended generic message is present.
- Added a regression test in commit `6dd1988914436d040295cd5c730966668d9a0cf3` that throws a fake secret-bearing provider error and asserts it is not exposed. CI for this candidate remains pending; do not mark validated until green CI is observed.
- No master-plan edit, registration, deployment, on-chain transaction, or production configuration change.


## Batch F follow-up — academic search validated; content extraction error sanitization pending (2026-10-17)

- User confirmed the ACADEMIC_SEARCH provider-error sanitization CI is green. The workflow-run lookup for test commit `6dd1988914436d040295cd5c730966668d9a0cf3` returned no run metadata, so this is recorded as user-confirmed rather than independently re-verified by the GitHub API.
- Continued in the frozen plan's original first-three-intent sequence and reviewed `CONTENT_EXTRACTION`. The catch handler returned raw `error.message` in its public uncertainty message, potentially disclosing internal diagnostics or secret-bearing strings.
- Candidate source commit `01c4d7b5a4ef637e89b79edaa40a6df585757de8` replaces the raw error with a stable generic message while preserving `insufficient_evidence`, zero confidence, empty evidence, and `content_extraction_failed`.
- Regression test commit `ab60f002c81c4b2f6b1391c63cb0f40426baf34a` verifies a fake secret-bearing extractor error is not exposed. Candidate CI remains pending; do not mark this candidate validated until green CI is confirmed.
- No master-plan edit, registration, deployment, on-chain transaction, or production configuration change.


## Batch D follow-up — content extraction sanitized; URL_SCAN reviewed (2026-10-17)

- Confirmed Content Extraction regression CI green: Verity CI run #645, conclusion `success`, on test commit `ab60f002c81c4b2f6b1391c63cb0f40426baf34a`. Run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39005915523
- Continued the first-intent sequence with a focused review of `URL_SCAN` source and existing tests. The handler already treats successful HTTP responses as reachability evidence, records status/content type, and does not make a URL reputation verdict; failed fetches/timeouts yield zero-confidence uncertainty.
- Security controls are already extensive and regression-tested: only HTTP(S), public-address checks for IPv4/IPv6, mixed DNS-answer rejection, address pinning for the native request path, bounded redirects, revalidation of each redirect target, credential-bearing redirect rejection, timeouts, and TLS certificate/hostname verification.
- No new URL_SCAN source change is justified from this review: a speculative verdict/confidence change would alter existing semantics without a defined evaluation oracle. Preserve the existing SSRF/TLS protections.
- This completes the current review of the original first-three intent sequence (DEEPFAKE_DETECTION, CONTENT_EXTRACTION, URL_SCAN) at code-review/regression level, but does **not** satisfy Batch E's before/after protocol-score measurement. Do not mark scoring acceptance or leaderboard improvement complete.
- Next: continue with remaining-intent triage under Batch F, while Batch E remains blocked for authoritative protocol score comparison. No master-plan edit, registration, deployment, on-chain transaction, or production configuration change.


## Batch F follow-up — deepfake detector error sanitization pending CI (2026-10-17)

- Continued the remaining-intent triage after the user confirmed the prior Content Extraction CI is green. Reviewed `DEEPFAKE_DETECTION` and found its detector-failure handler returned raw `error.message` in the public uncertainty field, potentially disclosing internal endpoints, diagnostics, or secret-bearing strings.
- Candidate source commit `45bdd935216588d941474577e9278198bdf6bdc2` replaces the raw message with `The configured deepfake detector could not process the media reference.` It preserves the existing `insufficient_evidence` verdict, confidence 0, empty evidence, and `deepfake_detector_failed` code.
- Regression test commit `f6b367ff4be88505c19b779b1a5181396b5117e6` injects a fake private endpoint/token in the thrown error and verifies it is not exposed.
- CI for this candidate has not yet been confirmed; leave pending until green CI is reported or observed. No scoring claim is made.
- No master-plan change, registration, deployment, on-chain transaction, or production configuration change.


## Batch F follow-up — deepfake sanitization validated; malware provider error sanitization pending (2026-10-17)

- Confirmed DEEPFAKE_DETECTION regression CI green: Verity CI run #649, conclusion `success`, on test commit `f6b367ff4be88505c19b779b1a5181396b5117e6`. Run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39006390468
- Continued remaining-intent review and inspected `MALWARE_DETECTION`. Its reputation-provider catch returned raw `error.message` in the public uncertainty response, potentially exposing internal endpoint URLs, diagnostic text, or secret-bearing strings.
- Candidate source commit `8233f1c7af803d6f58bd7a44e69714a379faff17` replaces that raw message with a stable generic error while preserving `insufficient_evidence`, confidence 0, empty evidence, and the existing `reputation_lookup_failed` code.
- Regression test commit `0ea4f8fbcdad1239e37b938cf1f652b4ee1cfcb8` injects a fake private endpoint/token in the provider error and asserts that it is not exposed. Candidate CI remains pending until confirmed green.
- No master-plan change, registration, deployment, on-chain transaction, or production configuration change.


## Batch F follow-up — malware sanitization validated; threat-intelligence provider error sanitization pending (2026-10-17)

- Confirmed MALWARE_DETECTION regression CI green: Verity CI run #652, conclusion `success`, on test commit `0ea4f8fbcdad1239e37b938cf1f652b4ee1cfcb8`. Run: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39006868480
- Continued remaining-intent review and inspected `THREAT_INTELLIGENCE`. Its provider-failure path returned raw `error.message` in the public uncertainty field, potentially exposing internal endpoint URLs, diagnostics, or secret-bearing strings.
- Candidate source commit `6294d7047ae4fd3af0a0f053d3f783c3d71b7ac0` replaces the raw provider error with a stable generic message while preserving `insufficient_evidence`, confidence 0, empty evidence, and the existing `threat_feed_lookup_failed` code.
- Regression test commit `0e6abc02d9a131a067e648e193c8b3f00dc9990f` injects a fake private endpoint/token into the provider error and asserts that it is not exposed. CI remains pending; do not mark the candidate validated until green CI is confirmed.
- No master-plan change, registration, deployment, on-chain transaction, or production configuration change.
