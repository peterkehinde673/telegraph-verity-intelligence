# Verity Intelligence — Season 2 Targeted Improvement Plan (Frozen)

**Objective:** Improve the user's exact ten target intents from the Epoch 421 Explorer snapshot, while preserving the current behavior and ranking potential of every other intent—especially those currently ranked #1 through #5. Season 2 has not started; no future score or rank is guaranteed.

## Exact optimization scope

Work only on these ten existing intents, in this priority order:

1. `VULNERABILITY_TRIAGE` — screenshot rank #6
2. `CONTENT_VERIFICATION` — rank #8
3. `URL_SCAN` — rank #8
4. `DEEPFAKE_DETECTION` — rank #10
5. `RESEARCH_SYNTHESIS` — rank #11
6. `SSL_VERIFICATION` — rank #13
7. `DNS_RECORD_LOOKUP` — rank #14
8. `URL_SAFE` — rank #14
9. `FACT_CHECK` — rank #15
10. `CONTENT_EXTRACTION` — rank #17

The Explorer snapshot is an epoch-specific baseline only. Subscript-style digits in scores represent decimal places; preserve the raw display and normalize only when the digits are clear.

## Protection and quality rules

- Do not change any non-target intent merely to improve the target ten. Preserve current behavior for all other intents, especially intents currently ranked #1–#5, so they retain the opportunity to remain or become #1.
- Shared code may be changed only for a clear correctness/security reason, with targeted regression tests for affected target and non-target intents.
- Do not optimize by inflating scores, fabricating evidence, weakening abstention, hiding uncertainty, weakening security/SSRF protections, or hardcoding evaluator behavior.
- Keep FACT_CHECK application logic in scope because it is explicitly one of the target ten. The FACT_CHECK/WASM scorer implementation and calibration remain out of scope.
- Work in small batches. A candidate is accepted only after relevant tests and CI pass. CI success shows code correctness, not protocol-score improvement.
- No new intents until all ten target intents have been reviewed and addressed or explicitly marked blocked.
- No deployment, live registration/re-registration, on-chain transaction, release publication, or production configuration change without validation and separate explicit user authorization.
- Do not commit credentials or private evaluation answers.

## Batch 0 — Correct plan and establish baseline
- [x] Replace the prior A–H plan with this exact ten-intent scope.
- [x] Preserve the user-provided Explorer baseline (epoch 421) and score-reading rule.
- [ ] Keep the baseline scores/ranks as a snapshot; transcribe unclear subscript digits only when legible.
- [x] Explicitly protect every non-target intent, especially current top-ranked intents #1–#5.

## Batch 1 — Vulnerability triage and content verification
- [x] Fix CVSS/supplied-severity contradiction in `VULNERABILITY_TRIAGE` and verify with CI.
- [x] Inspect `CONTENT_VERIFICATION`; redacted raw verifier exceptions and added regression test (CI #752 passed).
- [ ] Run targeted and full CI checks; check non-target regression coverage.

## Batch 2 — URL scan and URL safety
- [x] Inspect `URL_SCAN` and `URL_SAFE`; URL_SCAN protections reviewed with no extra change justified, URL_SAFE raw provider exceptions redacted (CI #754/#755 passed).
- [ ] Preserve SSRF protections, redirect/DNS handling, and fail-closed behavior.
- [ ] Add regression tests and validate with full CI.

## Batch 3 — Deepfake and research synthesis
- [x] Correct the `authentic_likely` verdict/confidence direction in `DEEPFAKE_DETECTION`; CI passed.
- [x] Inspect `RESEARCH_SYNTHESIS`; redacted raw synthesis-provider exceptions and added regression test (CI #757 passed).
- [ ] Test changes and ensure no shared regression.

## Batch 4 — SSL and DNS
- [x] Inspect `SSL_VERIFICATION` and `DNS_RECORD_LOOKUP`; existing validation, certificate/DNS failure handling, and sanitization tests cover reviewed cases; no additional source changes justified.
- [ ] Validate hostname/certificate expiry, DNS response semantics, malformed inputs, and unavailable-provider handling as applicable.
- [ ] Test changes and preserve security boundaries.

## Batch 5 — Fact check and content extraction
- [ ] Inspect application handlers/tests for `FACT_CHECK` and `CONTENT_EXTRACTION`. Do not touch the WASM scorer.
- [ ] Improve evidence/provenance, uncertainty, and extraction completeness only where a testable defect is identified.
- [ ] Run targeted/full CI and check non-target regression coverage.

## Batch 6 — Final target-ten review and integration readiness
- [ ] Verify all ten target intents have a recorded status: fixed and CI-verified, no reproducible defect found, or blocked with reason.
- [ ] Run the full required test suite, typecheck, build, integration tooling, and miner-template preflight.
- [ ] Verify manifest/dashboard integration requirements in a non-production/test path where possible.
- [ ] Prepare re-registration steps and rollback notes. Do not execute live registration without separate explicit approval.

## Batch 7 — Season 2 measurement and future expansion
- [ ] Wait until Season 2 starts before comparing season scores.
- [ ] After explicit approval, register/re-register and integrate using official Telegraph steps.
- [ ] Verify miner identity, supported intents, request health, and first scored epoch.
- [ ] Compare target-ten results against the epoch 421 baseline and report actual results without guaranteeing rank.
- [ ] Only after the target ten are completed or explicitly blocked, consider adding new intents.

**Freeze rule:** This is the active plan. Update task status as verified in `.verity-work/PROGRESS.md`. Revise scope only if the user explicitly changes the objective.
