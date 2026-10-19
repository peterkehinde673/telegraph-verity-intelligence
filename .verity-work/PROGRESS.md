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
- [x] Investigation commit `e78dfd213a5c81fb5523fdbda8634837ca9f37e0` was pushed; GitHub Actions CI passed (typecheck, build, tests, Telegraph canonical check, template preflight): https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39227519646. Keep `NEWS_SEARCH` unadvertised until the request-builder and YAML validation gates are met.

## Batch 2 — NEWS_SEARCH endpoint preparation (2026-10-19)

### State and ordered execution checklist

- [x] Confirmed the checkout is `/root/telegraph-verity-intelligence`, branch `verity/score-improvements-batch-1`, clean working tree, `origin` is the expected GitHub repository, and local/remote branch both point to `2f9d306f7325eb16924eb5baaa635c7c4bc041b6`.
- [x] Confirmed GitHub Actions run `39227700948` succeeded for the current branch state: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39227700948.
- [x] Requeried the official live registry: 134 entries. All ten names in the master-plan candidate list are exact canonical entries. Current miner counts: NEWS_SEARCH 18, WEB_SEARCH 25, TWITTER_SEARCH 10, SENTIMENT_ANALYSIS 19, DOCUMENT_AUTHENTICITY 12, ONCHAIN_METRIC_VERIFY 34, CONTRACT_OBLIGATION_AUDIT 13, SLA_COMPLIANCE 11, SHIPMENT_DELAY_RISK 10, FRAUD_DETECTION 29. These are counts only; no candidate is described as underserved.
- [x] Inspected the complete NEWS_SEARCH path from `src/server.ts` through `src/api.ts`, the handler registry, provider adapter, response contract, and tests. The implemented route is `POST /v1/intent`; the local body is `{ intent: "NEWS_SEARCH", input: { query: string } }` and the local result is the shared Verity envelope with article records and provenance evidence.
- [x] Rechecked Telegraph's Intent, YAML, and validation docs. The registry confirms name/meaning/count but does not publish a NEWS_SEARCH schema. YAML docs support top-level body `intent` and object `input` parameters but do not document nested-property validation. The Integrate request builder's ability to produce `input.query` remains an explicit dashboard validation question.
- [x] Added `docs/integrate-endpoint-guide.md` with proposed route, method, request shape, response example, authentication, content type, endpoint-base behavior, multipart and mapping fields. It distinguishes project API behavior from Telegraph guarantees and does not change either manifest.
- [x] Added a route-level test that starts the actual built server and calls `POST /v1/intent` for NEWS_SEARCH, exercising deterministic empty-query rejection without network access. Existing NEWS_SEARCH provider and evidence tests remain in place.
- [x] Corrected stale local API documentation that described a 20-intent catalogue and linked the new endpoint guide. The advertised miner manifests remain the original 29.
- [x] `npm run typecheck`, `npm run build`, `npm test` (286 passing), `node --test tests/news-search-endpoint.test.mjs` (1 passing), `npm run verify:telegraph` (all 30 local names canonical), `npm run preflight:miner`, `npm run preflight:registration`, `npm run smoke:render` (production service healthy with the existing 29 intents and three provider-backed checks), and `git diff --check` passed.
- [ ] `npm run validate:miner` did not validate: the documented endpoint returned HTTP 404 HTML (`text/html`), and the safe parser produced no validation result. No auth, endpoint substitution, or HTML bypass was used.
- [x] Reviewed the complete tracked diff and both new files; the manifests and production settings are unchanged, and no credentials or private evaluation data were added.
- [x] Commit `5ea6d78967e45efa1869a96a6f42709799fda49f` was pushed to the target branch; remote SHA matched. GitHub Actions run `39240080251` passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39240080251.

## Batch 3 — WEB_SEARCH implementation (completed, 2026-10-19)

- [x] Reverified live canonical `WEB_SEARCH`; registry returned canonical `true`, 25 miners, and a description for current/live/external web information. It is distinct from `NEWS_SEARCH` and Verity's Wikipedia-backed `RESEARCH_QUERY`.
- [x] Verified provider feasibility against Jina's official [Reader/Search docs](https://jina.ai/reader/) and [OpenAPI](https://docs.jina.ai/openapi.json): the Search API at `https://s.jina.ai/` supports query search and JSON result records including URL, title, description, and publication time. Jina requires an API key and documents token usage/rate limits. No live or billable request was made.
- [x] Added an isolated handler/provider implementation with optional `JINA_API_KEY`, bounded inputs/results/response bytes, HTTP(S)-only source URLs, provenance, timeout, safe errors, and abstention. It is not included in either miner manifest.
- [x] Added provider/handler tests for normal and empty responses, malformed inputs/envelopes, unsafe result URLs, missing credentials, timeouts as passed to fetch, and sanitized provider failures.
- [x] `npm run typecheck`, `npm run build`, focused WEB_SEARCH/provider/dispatch/manifest tests (19 passing), and `npm test` (300 passing) passed.
- [x] `npm run verify:telegraph` and `npm run preflight:registration` passed; all 31 local catalogue names are canonical and the unchanged template passed its repository preflight.
- [x] `npm run smoke:render` passed against the existing production service: it remains healthy with 29 intents and all 12 safe validation cases and three live provider-backed smoke cases passed. No deployment or production setting was changed.
- [x] `npm run validate:miner` exited 1: the documented endpoint returned HTTP 404 HTML, so no YAML validation result was produced. Credential variables were removed; no fallback URL or HTML bypass was used.
- [x] Reviewed the full tracked and new-file diff, verified both miner manifests are unchanged, ran whitespace and secret-pattern checks, and confirmed no credentials or private evaluation data were added.
- [x] Commit `717bac06d5bd8895f977c45500682793664d45ff` was pushed; the remote branch matches and GitHub Actions run `39243396991` passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39243396991.

### Current classification

- **Completed and verified:** NEWS_SEARCH route preparation; commit `5ea6d78967e45efa1869a96a6f42709799fda49f` and CI run `39240080251` passed.
- **Completed and CI-verified:** WEB_SEARCH with Jina Search, based on current canonical registry and official provider schema. Credential provisioning and Integrate request-building remain later deployment/manifest gates.
- **Canonical but feasibility not established:** TWITTER_SEARCH, SENTIMENT_ANALYSIS, DOCUMENT_AUTHENTICITY, ONCHAIN_METRIC_VERIFY, CONTRACT_OBLIGATION_AUDIT, SLA_COMPLIANCE, SHIPMENT_DELAY_RISK, FRAUD_DETECTION.
- **Still blocked for manifest integration:** NEWS_SEARCH and WEB_SEARCH until Integrate can build the nested project request and current miner YAML validation succeeds. The provider key must also be available externally before WEB_SEARCH is useful in a deployment.
- **External:** The documented Integrate validator remains HTTP 404 HTML; local implementation proceeds, but remote YAML validation is not passed.

### Implementation and response limits

- The provider adapter uses the official Jina Search API's JSON response envelope and `no-content` mode. It requires `JINA_API_KEY`, uses a 10-second request timeout, caps response bytes at 512 KiB and results at 10, and keeps only bounded title/URL/snippet fields with valid HTTP(S) links.
- `publishedTime` is retained when parseable. The response records source URLs/IDs, provider type, and retrieval time. Results are not treated as claim verification.
- Tests use mocked provider responses only. No Jina credential was read, no live Jina query was made, and no billable search was triggered.
- Both search intents remain out of `miner.yaml` and `miner.yaml.template`; the manifests still contain the original 29. The local catalogue contains 31.

### Work classification

- **Completed and verified:** NEWS_SEARCH live canonical name and count; local handler/provider behavior; shared HTTP route and response envelope; original 29 manifest entries protected by regression coverage.
- **Implementation-ready in this batch:** Document the actual NEWS_SEARCH route contract and test it end to end. This work does not assert Telegraph publishes that schema.
- **Awaiting more feasibility research:** WEB_SEARCH, TWITTER_SEARCH, SENTIMENT_ANALYSIS, DOCUMENT_AUTHENTICITY, ONCHAIN_METRIC_VERIFY, CONTRACT_OBLIGATION_AUDIT, SLA_COMPLIANCE, SHIPMENT_DELAY_RISK, FRAUD_DETECTION. Their canonical names and current counts are confirmed; overlap, attributable sources/inputs, safety, evaluation fit and useful local scopes are not yet established.
- **Awaiting Integrate request-builder / registration evidence:** NEWS_SEARCH. Keep it out of the manifest until the nested request shape is demonstrably accepted and the saved YAML validates.
- **External service blocker:** The documented Integrate validator returned HTTP 404 HTML in the previous investigation. No authentication, alternate production URL, or HTML-success bypass is justified; this does not block local implementation/tests.
- **Deferred proposals:** The six Phase 1B concepts remain proposals. Registry duplicate/near-equivalent review and proposal drafts are pending; none may be advertised without canonical acceptance.

### Proposed Integrate fields and known limits

- Incoming Telegraph path and upstream API path: `/v1/intent`; method: `POST`; content type: `application/json`.
- Base URL override: blank, using the existing top-level manifest base URL. Multipart fields and parameter mappings: none. Authentication: none, per server and current manifest.
- Top-level body parameters are the `intent` string and `input` object. Verity requires `input.query` to be non-empty for NEWS_SEARCH, but official YAML docs only describe an object parameter and do not confirm whether Integrate can build that nested field.
- The sample response in `docs/integrate-endpoint-guide.md` is a code-backed no-results abstention. No article/evidence example is presented as a real provider result.
- No screenshot image was found in the checkout; dashboard field names in this guide follow the field inventory supplied in the user request.

### Relevant sources

- Live registry: https://devnode.telegraphprotocol.com/engine/v1/intents
- Intent docs: https://docs.telegraphprotocol.com/docs/using/intents
- YAML guide (endpoint fields and params): https://docs.telegraphprotocol.com/docs/miners/yaml-config
- Validation API (request/response and limitations): https://docs.telegraphprotocol.com/docs/miners/validation-api
- Local server route: `src/server.ts`; project guide: `docs/integrate-endpoint-guide.md`.
