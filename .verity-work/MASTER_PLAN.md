# Verity Intelligence — Season 2 Targeted Improvement and Intent Expansion Plan

**Objective:** Preserve the completed target-ten quality work, then expand the miner in small, test-gated batches before Season 2. No future score, rank, traffic or revenue is guaranteed. Season 2 has not started as of this plan.

## Phase 0 — Completed target-ten review

The Epoch 421 Explorer screenshot was the baseline for this completed review:

1. `VULNERABILITY_TRIAGE` — rank #6
2. `CONTENT_VERIFICATION` — rank #8
3. `URL_SCAN` — rank #8
4. `DEEPFAKE_DETECTION` — rank #10
5. `RESEARCH_SYNTHESIS` — rank #11
6. `SSL_VERIFICATION` — rank #13
7. `DNS_RECORD_LOOKUP` — rank #14
8. `URL_SAFE` — rank #14
9. `FACT_CHECK` — rank #15
10. `CONTENT_EXTRACTION` — rank #17

All ten have a documented fix or review outcome in `.verity-work/PROGRESS.md`. CI success proves the tested code passed; it does not prove a protocol score or rank improved. FACT_CHECK/WASM scorer and calibration remain out of scope.

## Protection and quality rules

- Keep the current 29-intent manifest working while adding capabilities. Do not remove or rename existing intents as part of expansion.
- Preserve behavior for all existing intents, especially any currently top-ranked intents. Add regression tests for shared code paths.
- Do not manipulate scores, fabricate evidence, weaken abstention, hide uncertainty, or weaken security/SSRF protections.
- Every intent must have a real handler, explicit input/output behavior, deterministic error/abstention behavior where appropriate, tests, docs and an endpoint/manifest mapping before it is advertised.
- **Canonical gate:** Every name in `miner.yaml` must match Telegraph's live canonical registry exactly. Proposed concepts must not be added to `miner.yaml` until Telegraph accepts/canonicalizes them and the live registry confirms the exact name.
- **Coverage gate:** Check the live intent endpoint for current miner counts before choosing an intent. A canonical intent is not necessarily underserved; do not claim zero competition without checking.
- Keep all work in small batches. After each batch, run relevant tests and CI, review the diff, update `.verity-work/PROGRESS.md`, and stop to fix failures before starting the next batch.
- No deployment, release publishing, production configuration changes, live registration/re-registration or on-chain transaction until implementation and preflight are complete and the user separately confirms the final action.
- Keep credentials and private evaluation answers out of source control.

## Phase 1 — Candidate intake and canonical verification

Telegraph's docs describe the on-chain registry as the source of truth and expose the live list at `https://devnode.telegraphprotocol.com/engine/v1/intents`. The documentation and hackathon catalogue have shown different totals at different times, so use the current live registry—not a copied count or an older docs list—as final authority.

### A. Existing canonical candidates confirmed in the published Season II catalogue

The published catalogue includes the names below, and they are not in this repository's current 29-intent manifest. This confirms catalogue presence only—not current live registry status, miner competition, or that a candidate is underserved. Recheck the live registry and current miner coverage before choosing an implementation batch.

- `NEWS_SEARCH` — search news sources for a topic or query.
- `WEB_SEARCH` — retrieve web results for a query.
- `TWITTER_SEARCH` — search public social posts.
- `SENTIMENT_ANALYSIS` — classify sentiment and tone.
- `DOCUMENT_AUTHENTICITY` — assess document authenticity.
- `ONCHAIN_METRIC_VERIFY` — verify on-chain metrics.
- `CONTRACT_OBLIGATION_AUDIT` — extract and assess contract obligations.
- `SLA_COMPLIANCE` — check service-level compliance.
- `SHIPMENT_DELAY_RISK` — assess shipment-delay risk.
- `FRAUD_DETECTION` — assess potential fraud.

Priority selection should favour a useful canonical intent with verifiable inputs, a realistic data/provider path, clear evaluation criteria, and manageable implementation risk. Do not add every candidate automatically. Do not treat catalogue mission counts as miner competition counts.

### B. New intent concepts to propose to Telegraph

These are **proposals only**, not confirmed canonical names. Check the complete live registry for duplicates or near-equivalent intents first. Draft a concise use case, input/output contract, ground-truth/evaluation approach, safety boundaries and examples for Telegraph review. Only after acceptance and canonicalization can a selected exact name be added to `miner.yaml`.

1. `PROMPT_INJECTION_DETECTION` — detect hostile or instruction-hijacking text embedded in retrieved pages, documents or tool outputs; return quoted evidence and calibrated risk.
2. `AI_AGENT_ACTION_AUDIT` — assess whether an agent's proposed tool calls/actions match a declared task, authorization and policy; report evidence and violations.
3. `SOFTWARE_DEPENDENCY_RISK` — assess package and software supply-chain risk beyond a single CVE, using version, provenance, maintainer and dependency evidence.
4. `CLAIM_PROVENANCE_GRAPH` — map claims to supporting/contradicting sources and preserve traceable source links.
5. `API_CONTRACT_CONFORMANCE` — compare observed API responses and behaviour against an explicit schema/contract, with reproducible failing cases.
6. `CROSS_SOURCE_CONSISTENCY` — compare the same factual claims across independent sources and report conflicts, source timestamps and uncertainty.

Do not invent a registration-ready canonical name or promise Telegraph will accept a proposal. If a concept already exists under another canonical name, reuse that canonical intent rather than creating a duplicate.

## Phase 2 — Implementation batches

Work on one small batch at a time. Begin with Batch A only after Phase 1 confirms canonical status, coverage and feasibility. Prefer one or two intents per batch; reduce the batch if the provider or safety work is complex.

### Batch A — Low-dependency, testable canonical candidate(s)
- Select the best verified canonical candidate(s) from Phase 1A after checking the live registry, miner counts, data source availability and evaluator expectations.
- Define request examples, response shape, evidence requirements, abstention conditions, timeouts and sanitized errors before implementation.
- Add handler/dispatch mapping, unit and regression tests, docs and progress notes.
- Acceptance: tests and CI pass; existing 29 intents and their manifest mappings remain intact.

### Batch B — Second verified canonical candidate(s)
- Repeat the same discovery, implementation and test gates for the next highest-value candidate(s).
- Reuse existing safe infrastructure where justified; avoid broad refactors.
- Acceptance: tests and CI pass; no existing-intent regression; progress entry links the CI run.

### Batch C — Further canonical candidates, only if worthwhile
- Add further candidates in small batches based on verified coverage, realistic provider access, evaluation clarity and maintenance cost.
- Skip candidates whose data cannot be grounded or whose behaviour cannot be evaluated reliably.

### Batch D — New-concept proposal and canonicalization
- Prepare and submit proposals for selected concepts in Phase 1B through the appropriate Telegraph process; record the response and any requested canonical spelling.
- Do not declare a proposed intent as supported or add it to the manifest while awaiting acceptance.
- After an exact canonical name is confirmed, implement it in a later isolated batch with tests and documentation.

### Batch E — Manifest/YAML integration and regression gate
Only after an intent is implemented, tested and canonical:
- Add the exact canonical name consistently to the endpoint `intents`, `input_schema.intent.enum`, and `semantics.supported_intents` in `miner.yaml`.
- Update endpoint descriptions and intent-specific input documentation where necessary; ensure the handler accepts the advertised request shape.
- Check for duplicates and consistency across all three YAML lists, and confirm all old 29 intent names remain present.
- Run YAML/schema validation, endpoint sandbox/preflight validation, typecheck, build, unit tests and the full CI suite.
- Inspect the diff and compare the before/after manifest programmatically. Do not combine unimplemented proposals with supported intents.

## Phase 3 — Registration and post-registration verification

This phase is deliberately last. No live registration action is part of code implementation.

1. Freeze the tested commit and final YAML; preserve the previous valid YAML, current registration details and rollback instructions.
2. Validate the final YAML and endpoint through Telegraph Integrate's sandbox/preflight flow; resolve every failure before proceeding.
3. Present the exact YAML diff, canonical intent list, test/CI results, endpoint health and registration implications for review.
4. Only after separate explicit user approval, use the Telegraph Integrate dashboard with the authorized wallet to update/re-register. Do not sign or submit a transaction without that approval.
5. Confirm the dashboard reports success, then independently verify the live miner record, activation status, endpoint health and exact served intent list. Do not infer registration success from CI or a Git commit.
6. Record the transaction/registration identifiers only if actually returned by the dashboard, and document rollback steps.

## Season 2 measurement

After Season 2 starts and comparable measurements exist, compare actual intent scores/ranks and traffic with the epoch 421 baseline where comparable. Record dates, evidence and limitations. Do not claim improvement before measurements support it.

## Current state

- [x] Target-ten review completed and documented.
- [x] Previous Batch 7 removed; expansion is now explicitly planned as a separate, gated workstream.
- [x] Verified the live registry for `NEWS_SEARCH` on 2026-10-19: canonical, 18 miners. The registry docs give the intent meaning but no fixed per-intent JSON request/response schema.
- [x] Implemented and tested `NEWS_SEARCH` as a local handler using Google News RSS; the registration manifests still contain the original 29 intents.
- [ ] Confirm in Integrate that its request builder can produce the project-defined nested `{ intent: "NEWS_SEARCH", input: { query } }` request, then validate the saved YAML before adding the intent to either manifest. Telegraph does not publish an intent-specific schema; do not invent one.
- [x] Investigated official Intent, YAML, validator, and OpenAPI documentation; no authoritative per-intent `NEWS_SEARCH` JSON schema is published. The local query/result fields are explicitly documented as Verity contracts, with the builder behavior left for dashboard validation.
- [x] Confirmed the documented validation API URL currently answers POST with HTTP 404 HTML and no redirect. The docs describe it as unauthenticated, so do not add auth or change the URL without Telegraph confirmation.
- [ ] Verify the unchanged YAML with Telegraph Integrate's validation UI or obtain a working official validator endpoint before manifest integration.
- [ ] Recheck canonical status, current miner counts, provider feasibility, and contract requirements before selecting another implementation batch.
- [ ] Prepare selected Phase 1B proposals and obtain canonical confirmation before implementation/manifest changes.
- [ ] Complete manifest integration, preflight and regression checks.
- [ ] Obtain separate explicit approval before live Integrate dashboard registration/update.

## Current execution checklist (registry recheck: 2026-10-19)

The public live registry at <https://devnode.telegraphprotocol.com/engine/v1/intents> returned 134 entries on this check. The published Intent docs page still states an older count; use the live endpoint for canonical names and miner counts.

| Master-plan candidate | Live canonical | Current miners | Work status |
| --- | --- | ---: | --- |
| `NEWS_SEARCH` | Yes | 18 | Implemented locally; route guide and real-server test completed. Manifest remains gated on verifying Integrate can construct nested `input.query` and validating the saved config. |
| `WEB_SEARCH` | Yes | 25 | Purpose confirmed; overlap, safe source, and implementation feasibility not yet assessed. |
| `TWITTER_SEARCH` | Yes | 10 | Purpose confirmed; access to attributable public posts and implementation feasibility not yet assessed. |
| `SENTIMENT_ANALYSIS` | Yes | 19 | Purpose confirmed; overlap and evaluator-compatible local contract not yet assessed. |
| `DOCUMENT_AUTHENTICITY` | Yes | 12 | Purpose confirmed; verified document-signature/timestamp data source and implementation feasibility not yet assessed. |
| `ONCHAIN_METRIC_VERIFY` | Yes | 34 | Purpose confirmed; chain/RPC coverage, block anchoring, and implementation feasibility not yet assessed. |
| `CONTRACT_OBLIGATION_AUDIT` | Yes | 13 | Purpose confirmed; overlap with text/document handlers and contract/evaluation scope not yet assessed. |
| `SLA_COMPLIANCE` | Yes | 11 | Purpose confirmed; required measurement inputs and deterministic calculation contract not yet assessed. |
| `SHIPMENT_DELAY_RISK` | Yes | 10 | Purpose confirmed; reliable shipment/weather/port data and forecast evaluation not yet assessed. |
| `FRAUD_DETECTION` | Yes | 29 | Purpose confirmed; evidence sources, scope, and overlap with security/risk handlers not yet assessed. |

Current order of work:

1. [x] Complete NEWS_SEARCH endpoint preparation: verify the real server route and request/response behavior, document Integrate fields, add route-level coverage, and preserve the 29-intent manifest gate. Remote Integrate validation remains blocked by its documented endpoint's 404 HTML response.
2. Assess the remaining nine verified candidates against existing handlers, dependable attributable inputs, evaluation criteria, and safety boundaries; choose only a small feasible next batch.
3. Inspect the complete canonical registry for duplicate or near-equivalent entries for the six proposed concepts, then prepare selected proposal drafts and evaluation plans. Do not represent proposals as canonical.
4. Keep candidate manifests unchanged until the candidate's real route, request builder mapping, response contract, all manifest lists, and applicable validation checks are evidenced.
5. Revisit remote validator recovery separately; its known 404 does not block local implementation or tests, but it blocks claiming remote YAML validation passed.
6. Finish the implementation/configuration guide and preflight review. Live Integrate registration remains a separate manual action requiring the user's explicit approval.

The live registry check confirms canonical names and counts, not that any intent is underserved or suitable for this miner. The Integrate screen fields described by the user are used as the dashboard field inventory; no screenshot file was present in the checkout. Telegraph's public docs explain generic params but not nested per-property schemas, so the exact `input.query` builder behavior remains a dashboard validation question.
