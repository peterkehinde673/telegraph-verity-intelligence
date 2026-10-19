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
- **Canonical and locally implemented:** NEWS_SEARCH, WEB_SEARCH, TWITTER_SEARCH, SENTIMENT_ANALYSIS, ONCHAIN_METRIC_VERIFY, SLA_COMPLIANCE. All remain absent from both miner manifests pending the specific integration gates recorded below.
- **Canonical but deferred:** DOCUMENT_AUTHENTICITY until a supported signed-document format and independently trusted certificate/timestamp/notarization verification source are selected.
- **Canonical but deferred:** DOCUMENT_AUTHENTICITY, CONTRACT_OBLIGATION_AUDIT, pending the evidence and parser requirements recorded in their assessment notes.
- **Awaiting feasibility review:** SLA_COMPLIANCE, SHIPMENT_DELAY_RISK, FRAUD_DETECTION.
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

## Batch 6 — ONCHAIN_METRIC_VERIFY and DOCUMENT_AUTHENTICITY feasibility (2026-10-19)

- [x] Verified the live Telegraph registry entry again at https://devnode.telegraphprotocol.com/engine/v1/intents: `ONCHAIN_METRIC_VERIFY` is canonical, currently lists 34 miners, and describes a specific on-chain value at a stated block height or latest, including receipt/gas metrics. `DOCUMENT_AUTHENTICITY` remains canonical with 12 miners and describes document signature, certificate, notarization, timestamp, or tamper-evident-seal checks. Counts are not an underserved claim.
- [x] Reviewed the existing source tree for document-signature parsing and trusted certificate/timestamp verification. No supported signed-document parser, trust-anchor/revocation process, or independent notarization/timestamp source exists. A checksum or verification key supplied by the same caller cannot independently establish signer authenticity. Deferred this candidate until a supported format and trusted validation source are chosen; no placeholder handler was added.
- [x] Confirmed official Ethereum JSON-RPC documentation supports `eth_chainId` and the execution API defines receipt `transactionHash`, `blockNumber`, `blockHash`, and `gasUsed`: https://ethereum.org/developers/docs/apis/json-rpc/ and https://ethereum.github.io/execution-apis/api/methods/eth_getTransactionReceipt/. No Telegraph-specific request/response schema is published; the following is explicitly Verity's limited project contract.
- [x] Added a local `ONCHAIN_METRIC_VERIFY` handler scoped only to Ethereum mainnet transaction `gasUsed` at an explicit decimal block number. It validates hash/block/metric before provider access; uses only an operator-configured HTTPS `ETHEREUM_RPC_URL`, checks chain ID, transaction/block anchors, response size and timeout, rejects redirects, and sanitizes errors. Missing receipts, wrong block, invalid/unconfigured provider, or malformed response abstain. It reports single-node trust limitations and optional expected-value mismatches. No live RPC endpoint, credential, or transaction was used.
- [x] Added a project API/Integrate guide with endpoint path/method, request and representative response. This shares the existing `/v1/intent` route, but Integrate nested parameter construction is still unverified. The intent remains out of both manifests; the original 29 entries are protected by the manifest regression test.
- [x] Added provider/handler, input, no-result, wrong-chain, RPC error, malformed JSON/receipt, unsafe endpoint, expected mismatch, provenance, sanitized error, dispatch, and real HTTP route tests.
- [x] `npm run typecheck` and `npm run build` passed. Focused catalogue/dispatch/manifest/route/provider/handler tests passed (12); full `npm test` passed (325 tests).
- [x] `npm run preflight:registration` passed: the live registry contains all 34 local catalogue names and the miner template preflight passed. Both manifests still contain exactly the original 29 intents.
- [x] `npm run smoke:render` passed against the existing production service: healthy, 29 advertised intents, 12 safe validation cases, three provider-backed checks, and response contracts verified. No production settings were changed.
- [ ] `npm run validate:miner` remains blocked by HTTP 404 `text/html`; the validator correctly produced no result. No authentication or alternate URL was guessed.
- [x] `git diff --check` passed. Review confirmed no manifest changes, provider credentials, private evaluation data, scorer/calibration edits, deployment changes, or transactions.
- [ ] Commit and push only if required local checks pass; verify exact-commit GitHub Actions before proceeding.
- [ ] `DOCUMENT_AUTHENTICITY` unblocking evidence: select a supported signed format (for example a concrete PDF signature profile), trusted signer root/revocation behavior, and an independent timestamp/notarization validation source, then add vectors covering valid, tampered, expired/revoked, unknown-root, and missing-evidence cases.
- [ ] Manifest integration remains gated on an Integrate test confirming nested JSON request construction and successful validation of the saved YAML. Telegraph's documented validator remains a known HTTP 404 HTML blocker; do not count it as a pass or guess a replacement endpoint.

### ONCHAIN_METRIC_VERIFY project endpoint contract

- Telegraph path and API endpoint path: `/v1/intent`; method `POST`; JSON content type; no multipart or parameter mapping; current server has no inbound authentication. Base URL override stays blank. Runtime JSON-RPC URL is server-side configuration only and must not be exposed in Integrate parameters.
- Project body: `{ "intent": "ONCHAIN_METRIC_VERIFY", "input": { "metric": "transaction_gas_used", "transaction_hash": "0x…64 hex…", "block_number": "decimal", "expected_gas_used": "optional decimal" } }`.
- Project response: shared Verity envelope. It reports the receipt gas value, block and transaction identifiers, configured-node provenance and uncertainty. This is not an authoritative Telegraph response contract. The configured node is not independently cross-checked, and the implementation does not claim light-client proof or finality.
- Ethereum protocol evidence: https://ethereum.org/developers/docs/apis/json-rpc/ and https://ethereum.github.io/execution-apis/api/methods/eth_getTransactionReceipt/. Registry evidence: https://devnode.telegraphprotocol.com/engine/v1/intents.
- [x] Commit `d6ef4a42ae163c7017f8548b4e9440b4b8e1a273` was pushed to `origin/verity/score-improvements-batch-1`; remote SHA matched. GitHub Actions run `39258669977` passed typecheck, build, all tests, Telegraph integration-tool verification, and miner-template preflight: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39258669977.

## CONTRACT_OBLIGATION_AUDIT feasibility (2026-10-19)

- [x] Rechecked the live Telegraph registry: exact canonical name, `canonical: true`, currently 13 miners. Registry description calls for extracting deliverables, milestones, payment terms, performance commitments and possibly determining whether they were met. It distinguishes document integrity and invoice/PO reconciliation. Source: https://devnode.telegraphprotocol.com/engine/v1/intents.
- [x] Repository overlap review found only generic content extraction/synthesis and no contract parser, obligation model, legal-domain source, or project/ledger records that could evidence fulfillment. Raw user-provided contract text can ground quoted passages, but alone cannot verify completion or overdue status.
- [x] Deferred implementation: keyword rules would provide only fragile clause candidates and could misread definitions, exceptions, cross-references, amendments, jurisdiction-dependent terms, or “will” used outside an obligation. A text-generation model without grounded legal extraction and fulfillment records would not solve that evidence gap. No weak handler or manifest entry was added.
- [ ] Revisit when a specific supported contract format/field schema, evaluation corpus with reviewed ground truth, and independent fulfillment evidence (or a deliberately narrower extraction-only canonical scope accepted by Telegraph) are available.
- [x] Continue in master-plan order with SLA_COMPLIANCE; the contract-audit deferral does not block independent candidate review.
- [x] Deferral documentation commit `577a136` was pushed; GitHub Actions run `39259211587` passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39259211587.

## SLA_COMPLIANCE local implementation (2026-10-19)

- [x] Queried the live registry again: HTTP 200, 134 entries; `SLA_COMPLIANCE` is canonical and currently lists 11 miners. Its description covers measured response time, resolution time, and uptime over a period against a stated threshold. It distinguishes customer-ticket satisfaction. Source: https://devnode.telegraphprotocol.com/engine/v1/intents.
- [x] Repository review found no monitoring provider or historical metrics. Implemented only an explicit deterministic uptime calculation over caller-supplied full-period totals. It requires UTC ISO timestamps, a period no longer than 366 days, full period coverage as represented by `measured_seconds`, bounded integer downtime, and a stated target. No external provider call or customer data is involved.
- [x] Response states the computed uptime, target comparison, and a provenance record marked `user-provided-measurement`; uncertainty explicitly says source measurements, coverage, exclusions, and contract interpretation were not independently verified. No response-time or incident-resolution check is claimed.
- [x] Added focused tests for passing/failing target comparisons, malformed metrics, invalid/nonexistent dates, period boundaries, incomplete measurement totals, numeric boundaries, and malformed top-level input; added dispatch/manifest and real HTTP route regression coverage. Manifest remains the original 29.
- [x] `npm run typecheck`, `npm run build`, and 10 focused SLA/catalogue/dispatch/manifest/route tests passed. Full `npm test` passed (329 tests).
- [x] `npm run preflight:registration` passed: all 35 local catalogue names are present in Telegraph's live canonical set, and miner-template preflight passed. Both manifests remain at the original 29.
- [x] `npm run smoke:render` passed: existing production endpoint healthy, 29 advertised intents, 12 safe cases, three provider checks, response contracts verified. No deployment or production configuration was changed.
- [ ] `npm run validate:miner` again returned HTTP 404 HTML rather than JSON; no validation result was produced.
- [x] `git diff --check` passed; manifests were unchanged and the staged diff contained only the SLA calculator, tests, docs, and plan/progress updates.
- [x] Implementation commit `cd4f7c5b513af7e412742f373716101a3961a54f` was pushed; remote SHA matched. GitHub Actions run `39261937877` passed typecheck, build, all tests, Telegraph integration-tool verification, and miner-template preflight: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39261937877.
- [ ] Integration gate: verify Integrate can construct the project-defined nested `input.metric`, period, totals, and target, then successfully validate saved YAML. The local calculation does not establish a Telegraph-specific schema.

## Batch 4 — TWITTER_SEARCH implementation (2026-10-19)

- [x] Rechecked the public live registry from `https://devnode.telegraphprotocol.com/engine/v1/intents`: HTTP 200, 134 entries. The exact `TWITTER_SEARCH` record is canonical and lists 10 miners. Its description says this intent applies when the user wants posts/accounts/discussion searched on X/Twitter, not when the platform is only the topic.
- [x] Confirmed the provider contract from X's official [Search Posts guide](https://docs.x.com/x-api/posts/search/introduction), [Recent Search API reference](https://docs.x.com/x-api/posts/search-recent-posts), and [pay-per-use pricing](https://docs.x.com/x-api/getting-started/pricing). Recent search covers seven days, uses `GET https://api.x.com/2/tweets/search/recent`, requires bearer auth and `query`, returns JSON `data` and optional `includes`/`meta`, and currently requires `max_results` from 10 to 100. Current listed Post Read price is $0.005 per returned post; one request may therefore return/bill up to 10 ($0.05 at the listed rate). Prices may change.
- [x] Added an optional X recent-search provider and local `TWITTER_SEARCH` handler. `X_API_BEARER_TOKEN` is read only at runtime. Without it the handler abstains without outbound provider traffic. A call requests 10 results (API minimum) and returns at most five; uses a 10-second timeout and 512 KiB response cap; validates post IDs, author handles, URLs, timestamps and response shape; sanitizes failures; and preserves post URL/ID/text/provenance and timestamps when available. Results do not assert post truth.
- [x] Added provider, handler, dispatch, manifest regression, and real HTTP route tests, plus a project Integrate mapping and intent guide. `TWITTER_SEARCH` remains out of both miner manifests; all original 29 manifest intents are unchanged.
- [x] No X credential was inspected, no X request was made, and no billable call occurred. Before enabling the runtime key, configure a spending limit in X Developer Console.
- [x] `npm run typecheck`, `npm run build`, and full `npm test` passed (310 tests). Focused provider/handler/dispatch/manifest/route tests passed after correcting a timestamp-regex assertion in the new route fixture.
- [x] `npm run preflight:registration` passed: all 32 local names appear in the current Telegraph canonical registry and the miner template preflight passed. Both manifests remain unchanged at the original 29.
- [x] `npm run smoke:render` passed against the existing production service: healthy, 29 advertised intents, 12 safe validation cases, three live provider cases. No deploy or production configuration changed.
- [x] `git diff --check` passed; full diff review confirmed no manifest edits or credentials.
- [ ] `npm run validate:miner` remains blocked: documented endpoint returned HTTP 404 HTML; no validator result was produced.
- [x] Commit `a95d46422afa665194dde79f45215c35cf25aa0a` was pushed to `origin/verity/score-improvements-batch-1`; the remote ref matched. GitHub Actions run `39247857333` completed successfully for this exact SHA: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39247857333.
- [ ] Keep manifest integration gated: X's API contract is established, but Telegraph does not publish an intent-specific schema; Integrate nested `input.query` request construction and saved YAML validation remain unverified.

### TWITTER_SEARCH evidence

- Telegraph canonical registry: https://devnode.telegraphprotocol.com/engine/v1/intents (live record rechecked 2026-10-19; 134 canonical entries, `TWITTER_SEARCH` canonical, 10 miners).
- Telegraph registry purpose text distinguishes search for X/Twitter content from discussion merely about the platform.
- X documents Recent Search as `GET /2/tweets/search/recent`, searches the last seven days, requires a bearer token and `query`, supports 10–100 results, and returns `data` plus optional `includes`, `errors`, and `meta`: https://docs.x.com/x-api/posts/search-recent-posts.
- X's current listed Posts Read price is $0.005 per returned post: https://docs.x.com/x-api/getting-started/pricing. Actual prices can change; at `max_results=10`, the API may return up to 10 billable posts/request.
- Project route and Integrate fields are described in `docs/integrate-endpoint-guide.md`. This project contract is not a Telegraph guarantee.

## Batch 5 — SENTIMENT_ANALYSIS implementation (2026-10-19)

- [x] Rechecked Telegraph's live registry: HTTP 200, 134 entries. `SENTIMENT_ANALYSIS` is exact/canonical, lists 19 miners, and its description expects user-supplied text and a sentiment/tone classification. It distinguishes sentiment from category classification. No underserved claim is made.
- [x] Inspected repo overlap: no sentiment handler, model, or sentiment-specific classifier tests existed. The closest local capability is category/moderation classification, which solves a different task.
- [x] Verified the provider/model with official Hugging Face sources: text-classification docs recommend CardiffNLP's model for tweets; the model card maps negative/neutral/positive and states English suitability; public Hub metadata for `cardiffnlp/twitter-roberta-base-sentiment-latest` returned a live `hf-inference` mapping on 2026-10-19. Hugging Face docs specify text-classification input/output and bearer-token permission. The official HF JavaScript client source establishes the router URL pattern. No inference call or token access occurred.
- [x] Implemented `SENTIMENT_ANALYSIS` with a runtime-only `HF_TOKEN`, no outbound request when unconfigured, 4,000-character input cap, ten-second timeout, 64 KiB response cap, redirect rejection, score labels/range/normalization checks, sanitized failure abstention, and model URL/source attribution. It returns model-reported negative/neutral/positive scores and flags that they are not calibrated probabilities; below 0.55 it reports `uncertain`. The model is English/social-media oriented and the implementation reports polarity only, not discrete emotions or reliable non-English results.
- [x] Added mocked provider and handler tests for normal/empty/malformed/error/oversize provider cases, input validation, empty/unconfigured source, uncertainty, provenance, and sanitized abstention. Added dispatch, manifest regression, and route tests. `SENTIMENT_ANALYSIS` remains absent from both manifests; existing 29 advertised intents are unchanged.
- [x] Focused checks passed: `npm run typecheck`, `npm run build`, and 15 targeted provider/handler/catalogue/manifest/route tests.
- [x] `npm run typecheck`, `npm run build`, and full `npm test` passed (317 tests).
- [x] `npm run preflight:registration` passed: all 33 local intents are currently canonical and the template preflight passed; both manifest files remain unchanged at the original 29.
- [x] `npm run smoke:render` passed against the existing production service: healthy, 29 advertised intents, 12 safe validation cases, three live provider cases. No deployment or production configuration was changed.
- [x] `git diff --check` passed; full review found no credential values or miner manifest changes.
- [ ] `npm run validate:miner` again returned HTTP 404 HTML rather than JSON; no remote YAML validation result was produced.
- [x] Commit `55a15af0bc8adb80dc93ce584a4583f0ce2f560f` was pushed to the target branch; the remote ref matched. GitHub Actions run `39253954588` passed typecheck, build, all tests, Telegraph tooling verification, and miner template preflight: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39253954588.
- [ ] Manifest gate remains closed: Telegraph does not publish a per-intent schema; Integrate nested `{ intent, input: { text } }` construction and saved YAML validation remain unverified. Provider token access/credits and external text processing require separate operational review before enabling.

### SENTIMENT_ANALYSIS sources

- Telegraph live registry: https://devnode.telegraphprotocol.com/engine/v1/intents (`SENTIMENT_ANALYSIS`, canonical, 19 miners; rechecked 2026-10-19).
- Hugging Face Text Classification API: https://huggingface.co/docs/inference-providers/tasks/text-classification.
- CardiffNLP model card (English suitability and negative/neutral/positive labels): https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest.
- Live model/provider mapping, read from Hugging Face Hub public metadata: https://huggingface.co/api/models/cardiffnlp/twitter-roberta-base-sentiment-latest?expand%5B%5D=pipeline_tag&expand%5B%5D=inferenceProviderMapping (pipeline `text-classification`, `hf-inference` status `live`; no inference request made).
- Hugging Face client route/response behavior: https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/providers/hf-inference.ts.
- Hugging Face provider pricing/credits: https://huggingface.co/docs/inference-providers/pricing.

### Relevant sources

- Live registry: https://devnode.telegraphprotocol.com/engine/v1/intents
- Intent docs: https://docs.telegraphprotocol.com/docs/using/intents
- YAML guide (endpoint fields and params): https://docs.telegraphprotocol.com/docs/miners/yaml-config
- Validation API (request/response and limitations): https://docs.telegraphprotocol.com/docs/miners/validation-api
- Local server route: `src/server.ts`; project guide: `docs/integrate-endpoint-guide.md`.
