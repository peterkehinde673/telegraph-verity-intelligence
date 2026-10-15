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
