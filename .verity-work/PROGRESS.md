# Verity Work Progress — Season 2

Active plan: `.verity-work/MASTER_PLAN.md`. Season 2 has not started. The ten target intents are reviewed; intent expansion is now planned as a separate, gated workstream.

## Target-ten result

- [x] `VULNERABILITY_TRIAGE`: numeric CVSS takes precedence over conflicting supplied severity; CI #745.
- [x] `CONTENT_VERIFICATION`: raw provider exceptions redacted; CI #752.
- [x] `URL_SCAN`: redirect revalidation, private/reserved IPv4/IPv6, credentialed redirects, redirect limits, TLS and resolver failure handling reviewed; no additional defect established.
- [x] `DEEPFAKE_DETECTION`: corrected `authentic_likely` verdict/confidence direction; CI #735.
- [x] `RESEARCH_SYNTHESIS`: raw provider exceptions redacted; CI #757.
- [x] `SSL_VERIFICATION`: input validation, SNI, certificate authorization, normalized errors and socket cleanup reviewed; no additional defect established.
- [x] `DNS_RECORD_LOOKUP`: hostname/label validation, record types, missing records, transient resolver failures and error sanitization reviewed; no additional defect established.
- [x] `URL_SAFE`: raw provider exceptions redacted; CI #754/#755.
- [x] `FACT_CHECK` app handler: raw checker exceptions redacted; CI #762. WASM scorer untouched.
- [x] `CONTENT_EXTRACTION`: non-empty text with blank content type now abstains; source/test/progress CI #764/#765/#766.

## Batch 6 — final quality and integration readiness

- [x] All ten target intents have a documented disposition above.
- [x] Latest Verity CI #768 passed typecheck, build and tests: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39153404931.
- [x] Previous final-progress CI #767 passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39153399595.
- [x] Reviewed registration tooling and miner template. Repo `miner.yaml` uses Miner ID 5530 and declares 29 intents. `miner.yaml.template` intentionally uses an unused-ID placeholder. CI success is not proof that the live dashboard has been updated.
- [ ] Live Integrate/dashboard validation and confirmation that Explorer lists the same intent set — external action; not executed.
- [ ] After explicit approval: submit/update registration via Telegraph Integrate dashboard, confirm success, verify Explorer intent list and API health; retain previous valid YAML and commit SHA for rollback. Do not change ID unless the official registry requires it.
- [ ] After Season 2 begins, compare actual scores against epoch 421 baseline; no score/rank improvement claimed yet.

## Intent expansion — planned, not implemented

- [x] Added candidate-intake and implementation/registration gates to `.verity-work/MASTER_PLAN.md`.
- [x] Recorded existing canonical-name candidates to verify against the live registry and miner counts, plus proposed new concepts requiring Telegraph canonicalization.
- [ ] Query the current canonical registry and miner counts; select a small first batch based on demand, coverage, reliable data and evaluator fit.
- [ ] Implement selected canonical candidate(s) with handlers, input/output contracts, tests, docs and regression coverage.
- [ ] Update `miner.yaml` only after implementation is complete and the exact name is confirmed canonical. Keep the existing 29 intents intact and validate all manifest lists together.
- [ ] Run schema/preflight, typecheck, build, tests and full CI after each batch.
- [ ] Submit proposed new concepts to Telegraph and wait for explicit canonical confirmation before advertising them in YAML.
- [ ] Complete final preflight and obtain separate explicit approval before any live dashboard update/re-registration.

## Guardrails

- Preserve all existing intents, especially any currently ranked #1–#5; changes require regression coverage.
- No WASM/scorer changes, score manipulation, deployment, live registration, on-chain transaction, release publication or production configuration change without separate explicit approval.
- Do not claim live registration, dashboard state, competition counts, or score/rank gains without direct current evidence.

## Batch A — candidate verification

- [x] Confirmed `NEWS_SEARCH`, `WEB_SEARCH`, `TWITTER_SEARCH`, `SENTIMENT_ANALYSIS`, `DOCUMENT_AUTHENTICITY`, `ONCHAIN_METRIC_VERIFY`, `CONTRACT_OBLIGATION_AUDIT`, `SLA_COMPLIANCE`, `SHIPMENT_DELAY_RISK`, and `FRAUD_DETECTION` appear in the published Telegraph Season II intent catalogue.
- [x] Corrected the master-plan candidate list to avoid treating unverified names as canonical candidates.
- [ ] Retrieve the live canonical registry and per-intent miner coverage. The public catalogue lists mission usage, not miner competition; the live registry endpoint was inaccessible during this check.
- [x] Selected `NEWS_SEARCH` for an isolated implementation prototype because it is documented as a canonical Telegraph intent and the existing public news RSS provider can supply source-backed results. Live miner coverage is still unverified; this is not a claim of zero competition.
- [x] Added an isolated `NEWS_SEARCH` handler, sanitized provider failures, bounded/validated result selection, and tests for evidence, empty input, invalid results, result limits and abstention.
- [x] Wired the handler and added the intent to the local TypeScript catalogue; updated catalogue/router tests for 30 local intents.
- [ ] CI for the implementation commit is running; do not proceed to YAML integration until green.
- [ ] Verify live canonical registry and miner count, then update `miner.yaml` and `miner.yaml.template` consistently only after CI passes. Until then both registration manifests remain unchanged.
