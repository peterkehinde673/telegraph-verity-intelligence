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
- [x] Keep the baseline scores/ranks as a snapshot; transcribe unclear subscript digits only when legible.
- [x] Explicitly protect every non-target intent, especially current top-ranked intents #1–#5.

## Batch 1 — Vulnerability triage and content verification
- [x] Fix CVSS/supplied-severity contradiction in `VULNERABILITY_TRIAGE` and verify with CI.
- [x] Inspect `CONTENT_VERIFICATION`; redacted raw verifier exceptions and added regression test (CI #752 passed).
- [x] Relevant regression tests and CI passed for the implemented target-ten changes; reviewed handlers had no additional justified changes.

## Batch 2 — URL scan and URL safety
- [x] Inspect `URL_SCAN` and `URL_SAFE`; URL_SCAN protections reviewed with no extra change justified, URL_SAFE raw provider exceptions redacted (CI #754/#755 passed).
- [x] Reviewed and preserved SSRF protections, redirect/DNS handling, and fail-closed behavior.
- [x] URL_SAFE provider-error regression passed CI #754/#755; URL_SCAN existing protections reviewed.

## Batch 3 — Deepfake and research synthesis
- [x] Correct the `authentic_likely` verdict/confidence direction in `DEEPFAKE_DETECTION`; CI passed.
- [x] Inspect `RESEARCH_SYNTHESIS`; redacted raw synthesis-provider exceptions and added regression test (CI #757 passed).
- [x] DEEPFAKE_DETECTION and RESEARCH_SYNTHESIS changes passed CI; no shared scorer changes.

## Batch 4 — SSL and DNS
- [x] Inspect `SSL_VERIFICATION` and `DNS_RECORD_LOOKUP`; existing validation, certificate/DNS failure handling, and sanitization tests cover reviewed cases; no additional source changes justified.
- [x] Reviewed hostname/certificate handling, DNS response semantics, malformed inputs and unavailable-provider behavior; no additional defect justified.
- [x] Reviewed SSL/DNS validation and failure handling; no source change needed, and full CI remains green.

## Batch 5 — Fact check and content extraction
- [x] Inspected application handlers; FACT_CHECK provider errors redacted and CONTENT_EXTRACTION rejects blank content type. WASM scorer untouched.
- [x] Applied test-backed failure-handling fixes; no unsupported evidence or score bonuses introduced.
- [x] FACT_CHECK CI #762 and CONTENT_EXTRACTION source/test/progress CI #764/#765/#766 passed.

## Batch 6 — Final target-ten review and integration readiness
- [x] All ten target intents have recorded status in PROGRESS.md: implemented and CI-verified or reviewed with no additional reproducible defect found.
- [x] Latest Verity CI #768 passed typecheck, build and test suite. Miner template preflight is defined in scripts and CI workflow; no claim of live Integrate validation.
- [x] Reviewed manifest and integration scripts: current miner.yaml has ID 5530 and 29 intents; template deliberately retains unused-ID placeholder. Live Integrate/dashboard update remains an external/manual step.
- [x] Re-registration checklist and rollback notes recorded in PROGRESS.md; live registration not executed.

**Freeze rule:** This plan records the completed target-ten review. Any future intent expansion is a separate, explicit scope decision: first verify the current canonical intent registry and miner coverage, then assess implementation feasibility and tests. Do not add non-canonical intent names to miner.yaml. Update task status only when verified in `.verity-work/PROGRESS.md`.
