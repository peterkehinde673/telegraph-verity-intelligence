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
