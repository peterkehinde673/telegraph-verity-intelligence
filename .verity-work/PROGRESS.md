# Verity Work Progress — Season 2

Active plan: `.verity-work/MASTER_PLAN.md`. The user's exact target is the ten intents listed there, not catalogue positions 20–29. Season 2 has not started. Keep changes in small batches.

## Target-ten status

- [x] Master plan corrected to the exact ten user-specified intents and priority order (commit `8be7ff56e9304ca7298cf2908b24950c8ebbd0b6`).
- [x] `VULNERABILITY_TRIAGE`: valid numeric CVSS now controls normalized severity when supplied severity conflicts; CI run #745 passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39129372021
- [x] `DEEPFAKE_DETECTION`: `authentic_likely` maps to `likely` and confidence direction is corrected; CI run #735 passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39082141570
- [ ] `CONTENT_VERIFICATION`
- [ ] `URL_SCAN`
- [ ] `RESEARCH_SYNTHESIS`
- [ ] `SSL_VERIFICATION`
- [ ] `DNS_RECORD_LOOKUP`
- [ ] `URL_SAFE`
- [ ] `FACT_CHECK` application handler only; WASM scorer/calibration is excluded
- [ ] `CONTENT_EXTRACTION`

## Additional verified fixes

- [x] `THREAT_IP_REPUTATION`: provider exception details are redacted; CI run #743 passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39129001210
- [x] `REGRESSION_VERIFY`: JSON assertions with `json_path` but no `equals` are rejected; CI run #748 passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39129534768

## Baseline and guardrails

- User screenshot: epoch 421, miner shown Active, 9 requests served, best rank #1, epochs participated 0. Ranks are a snapshot, not a guarantee.
- Clearly legible zero scores in screenshot: `DEEPFAKE_DETECTION` #10, `FACT_CHECK` #15, `CONTENT_EXTRACTION` #17. Read subscript-style score digits as decimal places; do not guess unclear values.
- Preserve every non-target intent, especially current ranks #1–#5. Shared changes require regression tests.
- No WASM/scorer changes, score manipulation, weakened security controls, deployment, registration, on-chain transaction, release publication, or production config changes without separate explicit approval.
- Do not add new intents until all target-ten intents are reviewed and fixed or explicitly blocked.

- [x] `CONTENT_VERIFICATION`: raw verifier exception text replaced with a generic failure message; regression test passed CI run #752: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39130770372.
- [x] Master-plan scope correction CI green: run #750 https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39130718734; progress-log reset CI green: run #751 https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39130735043.

- [ ] `URL_SAFE` candidate: raw reputation-provider exceptions were returned in `reputation_lookup_failed`, potentially exposing internal URLs/details. Replaced with generic message and added regression test. Source `fe620789ea70068f91461577df4c049d1899b954`; test `5cc66130b155bdc953e2a8acadbb9499010e17a7`. CI run #754 queued: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39151958681.
- [x] `URL_SCAN` reviewed: existing tests cover redirect revalidation, private/reserved IPv4/IPv6, DNS timeout/failure sanitization, credentials in redirects, redirect limits, and TLS certificate validation. No new source change justified in this pass.
