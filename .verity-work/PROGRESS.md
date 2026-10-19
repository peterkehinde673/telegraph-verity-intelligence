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
- [x] Retrieved the live registry from `https://devnode.telegraphprotocol.com/engine/v1/intents` on 2026-10-19: 134 canonical intents; `NEWS_SEARCH` is canonical and currently lists 18 miners. This is not an underserved-intent claim.
- [x] Confirmed the official registry description distinguishes article/coverage search from headline lists. No fixed per-intent JSON request/response schema is published in the registry docs; the exact Telegraph integration contract remains a blocker to manifest advertisement.
- [x] Selected `NEWS_SEARCH` for isolated local implementation because its current official description is clear and Google News RSS provides source-backed article results.
- [x] Added an isolated `NEWS_SEARCH` handler, sanitized provider failures, bounded/validated result selection, and tests for evidence, empty input, malformed responses, invalid results, result limits and abstention.
- [x] Wired the handler and added the intent to the local TypeScript catalogue; updated catalogue/router tests for 30 local intents.
- [x] Latest CI run for implementation commit `e267ac015b2d6b629e566e9f73d1bcc24901b1ab` passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39197144619.
- [ ] Confirm Telegraph's request/response contract before adding `NEWS_SEARCH` to `miner.yaml` and `miner.yaml.template`. Both manifests remain unchanged; the original 29 manifest intents are still the advertised set.
- [x] Added an explicit manifest regression test that compares all three intent lists in both YAML files to the original 29 and excludes `NEWS_SEARCH` until contract approval.
- [x] Local verification: `npm run typecheck`, `npm run build`, `npm test` (281 passing), and `npm run preflight:registration` passed. This preflight verified all 30 local catalogue names exist in the live canonical set and the unchanged template is valid.
- [ ] `npm run validate:miner` could not validate YAML: the configured Telegraph Integrate validation URL returned the Developer Console HTML page rather than JSON. No registration or production change was attempted; obtain a working validator endpoint before relying on remote YAML validation.
- [x] Follow-up commit `96b764d99ae20eeda14fd6d91bf85e97c62ab158` was pushed and its GitHub Actions CI passed (typecheck, build, tests, Telegraph canonical check, and template preflight): https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39203940332.

## Batch 1 follow-up — contract and validator investigation (2026-10-20)

- [x] Re-queried the live registry: HTTP 200, 134 canonical intents; `NEWS_SEARCH` remains canonical with 18 miners. Its runtime record exposes only ID/name, canonical flag, description and miner count; the description distinguishes article coverage from `NEWS_HEADLINES`.
- [x] Reviewed [Intent docs](https://docs.telegraphprotocol.com/docs/using/intents), [YAML configuration docs](https://docs.telegraphprotocol.com/docs/miners/yaml-config), [validation API docs](https://docs.telegraphprotocol.com/docs/miners/validation-api), and Telegraph's [published miner-dispatcher OpenAPI](https://github.com/telegraphprotocol/telegraph-api-docs/blob/main/openapi/miner-dispatcher.yaml). These establish intent meaning, generic miner YAML/request metadata, and the validator's own request/response envelope, but no authoritative per-intent `NEWS_SEARCH` JSON input/output schema.
- [x] The local handler's `{ intent, input: { query } }` request and Verity response shape are repository contracts. Since Telegraph's intent-specific schema is undocumented, protocol conformance cannot be asserted and both manifests remain at the original 29 intents.
- [x] Diagnosed `POST https://integrate.telegraphprotocol.com/api/validate`: HTTP 404, `text/html; charset=utf-8`, no redirect, Developer Console 404 HTML page. Official docs specify this route is unauthenticated; optional `api_key` is only for upstream auth that consumes a key, and the current miner YAML has `auth.type: none`. Evidence does not distinguish a route removed from the deployed console from a service deployment/configuration issue.
- [x] Hardened validator response parsing to reject non-JSON, malformed JSON, and JSON missing the documented boolean `valid` field without echoing the response body. Added unit coverage for those failures and the documented response envelope.
- [x] Checks: `npm run typecheck`, `npm run build`, `npm test` (285 passing), `npm run preflight:registration`, and `git diff --check` passed. The no-credential `npm run validate:miner` invocation exits 1 with a sanitized HTTP 404 / HTML diagnostic; validation did not occur.
- [ ] Validator route remains unavailable. Safe manual next step: test the unchanged YAML in Telegraph Integrate's documented validation UI without registering; if it fails too, request a restored/current API endpoint from Telegraph. Do not change the validator URL or add authentication based on a guess.
- [ ] Run CI for this investigation commit; keep `NEWS_SEARCH` unadvertised until Telegraph confirms its per-intent contract.
