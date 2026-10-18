# Verity Work Progress — Season 2

Active plan: `.verity-work/MASTER_PLAN.md`. Season 2 has not started. Work is limited to the user's exact target ten; do not add intents yet.

## Target-ten status

- [x] `VULNERABILITY_TRIAGE`: numeric CVSS takes precedence over conflicting supplied severity; CI #745 passed.
- [x] `CONTENT_VERIFICATION`: provider exception details redacted; regression test CI #752 passed.
- [x] `URL_SCAN`: reviewed redirect revalidation, private/reserved IPv4/IPv6, credentialed redirects, redirect limits, TLS and resolver failures; no additional change justified.
- [x] `DEEPFAKE_DETECTION`: corrected `authentic_likely` verdict/confidence direction; CI #735 passed.
- [x] `RESEARCH_SYNTHESIS`: provider exception details redacted; CI #757 passed.
- [x] `SSL_VERIFICATION`: reviewed input validation, SNI, certificate authorization, normalized errors and socket cleanup; no additional change justified.
- [x] `DNS_RECORD_LOOKUP`: reviewed hostname/label validation, record types, missing records, transient resolver failures and error sanitization; no additional change justified.
- [x] `URL_SAFE`: provider exception details redacted; CI #754/#755 passed.
- [x] `FACT_CHECK` application handler: checker exception details redacted; CI #762 passed. WASM scorer/calibration untouched.
- [x] `CONTENT_EXTRACTION`: non-empty content with blank content type now abstains with `invalid_extraction_response`; source CI #764, test CI #765, progress CI #766 all passed.

## Additional verified correctness fixes

- [x] `THREAT_IP_REPUTATION`: provider exception details redacted; CI #743 passed.
- [x] `REGRESSION_VERIFY`: JSON assertions lacking expected `equals` rejected; CI #748 passed.

## Baseline and guardrails

- User-provided Explorer snapshot: epoch 421; miner shown Active; 9 requests served; best rank #1; epochs participated 0. These are snapshot values, not guarantees.
- Clearly legible zero scores: `DEEPFAKE_DETECTION` rank #10, `FACT_CHECK` rank #15, `CONTENT_EXTRACTION` rank #17. Subscript-style digits represent decimal places; don't guess illegible values.
- Protect all non-target intents, especially current ranks #1–#5. Shared changes require regression tests.
- No WASM/scorer changes, score manipulation, weakened security controls, deployment, live registration/re-registration, on-chain transaction, release publication, or production config changes without separate explicit approval.
- No new intents until target-ten review and readiness checks are complete.
