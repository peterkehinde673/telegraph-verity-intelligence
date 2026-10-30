> **CURRENT DIRECTION — updated 2026-10-30 (supersedes the implementation-first expansion phases below).** The immediate objective is to prepare high-quality evaluation material for Telegraph Intents. Do **not** build evaluation adapters, scoring modules, or new handlers as the next task. The Telegraph team explained that post-migration scoring is limited because the system does not yet have evaluation adapters for many Intents; participants need adapters for intelligence to be ranked, and the platform team is optimizing the system. Their recommended first step was evaluation material because it is easier to prepare. Evaluation material is prerequisite work; it does **not** by itself guarantee an Intent will score until Telegraph's evaluation path/adapter is available.

## Active workstream: evaluation material first

1. **Confirm Telegraph's evaluation-material contract before producing a large dataset.** Ask the team for the accepted schema/file format, submission location/process, minimum or target cases per Intent, public versus private data rules, licensing requirements, ground-truth review expectations, freshness rules, and how material is selected for an evaluation pool.
2. **Build a reusable evaluation-material specification.** Each case should use the exact canonical Intent and include a representative input, expected outcome/answer, ground-truth label or structured result where applicable, authoritative evidence/source URLs and retrieval timestamps, judging rubric, and notes on uncertainty/abstention. Include positive, negative, boundary, ambiguous, and adversarial cases where relevant.
3. **Prioritize quality over volume.** Ground truth must be independently checkable, traceable, current where time-sensitive, legally usable, and sufficiently unambiguous for two reviewers to reach the same judgment. Exclude unsupported, fabricated, unverifiable, or personally sensitive data. Keep private evaluation answers and credentials out of public source control unless Telegraph explicitly requires and authorizes a secure workflow.
4. **Pilot one Intent before scaling.** THREAT_INTELLIGENCE_INDICATOR is a sensible candidate to discuss because prior diagnostics found an active evaluation pool for it; confirm with Telegraph that it is still eligible and that its material format is representative before selecting it. Do not assume the old pool guarantees scoring.
5. **Review the material with Telegraph, then expand across the supported canonical Intent set** based on evaluator requirements, reliable ground-truth availability, and practical maintenance cost.
6. **Only after the evaluation material is accepted and Telegraph confirms the adapter interface and scoring requirements**, plan any adapter implementation as a separate, explicitly approved phase. Adapter work is not authorized by this plan update.

## Evaluation case quality checklist

- Exact canonical Intent name; no local aliases substituted for canonical names.
- Clear, realistic input matching the Intent's intended scope.
- Expected result expressed in a form that can be judged consistently.
- Evidence supports the expected result; source, timestamp, and relevant excerpt/identifier are recorded.
- Explicit rubric for correct, partially correct, incorrect, unsupported, and abstaining responses.
- Edge cases and known limitations are represented without making the expected answer ambiguous.
- No fabricated evidence, score manipulation, leaked private labels, or unlicensed data.
- Dataset version, provenance, reviewer, review date, and change history are recorded.

## Current scoring context and limits

- The owner reports that Telegraph's team attributed the post-migration scoring gap primarily to missing evaluation adapters and recommended preparing evaluation material first.
- Earlier diagnostics for Miner 5530 found 35 supported Intent entries, but scoring routes/evaluation pools were not available for most Intents at that time; 33 were reported as not routed, while only a small number had scoring infrastructure. These are point-in-time diagnostics, not a promise of current platform state.
- A historical score for THREAT_INTELLIGENCE_INDICATOR and an active pool were observed in earlier diagnostics. Recheck with Telegraph before using this as the pilot.
- Do not claim that 33 Intents are scoring, that evaluation material alone activates scoring, or that any score/rank improvement is guaranteed.

## Explicitly paused

- Do not build evaluation adapters or new scoring modules now.
- Do not add handlers, expand manifests, rename canonical Intents, or change the registered YAML as part of this evaluation-material phase.
- Do not re-register Miner 5530, change production configuration, deploy, publish a release, or submit/sign an on-chain transaction for this work.
- Do not resume the older candidate implementation batches below unless the evaluation-material phase is complete and the user explicitly approves a new implementation plan.

---
# Verity Intelligence — Evaluation Material First Plan

**Historical implementation/intent-expansion plan follows below and is paused by the current direction above.**

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
- `ONCHAIN_METRIC_VERIFY` — verify on-chain metrics (local scope narrowed to Ethereum mainnet transaction gas used at an explicit block).
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
- [x] Rechecked canonical status and provider feasibility for DOCUMENT_AUTHENTICITY and ONCHAIN_METRIC_VERIFY; see the current execution checklist. DOCUMENT_AUTHENTICITY is deferred; ONCHAIN_METRIC_VERIFY has a narrow local implementation.
- [ ] Prepare selected Phase 1B proposals and obtain canonical confirmation before implementation/manifest changes.
- [ ] Complete manifest integration, preflight and regression checks.
- [ ] Obtain separate explicit approval before live Integrate dashboard registration/update.

## Current execution checklist (registry recheck: 2026-10-19)

The public live registry at <https://devnode.telegraphprotocol.com/engine/v1/intents> returned 134 entries on this check (rechecked for ONCHAIN_METRIC_VERIFY on 2026-10-19). The published Intent docs page still states an older count; use the live endpoint for canonical names and miner counts.

| Master-plan candidate | Live canonical | Current miners | Work status |
| --- | --- | ---: | --- |
| `NEWS_SEARCH` | Yes | 18 | Implemented locally; route guide and real-server test completed. Manifest remains gated on verifying Integrate can construct nested `input.query` and validating the saved config. |
| `WEB_SEARCH` | Yes | 25 | Implemented and tested locally using Jina Search's attributable result API. It uses `JINA_API_KEY`, abstains without it, and remains out of manifests pending credential readiness and Integrate request-builder validation. |
| `TWITTER_SEARCH` | Yes | 10 | Implemented locally using X recent search; the API's seven-day window, bearer requirement, minimum 10-result request, response structure, and current per-post pricing are documented. Not in manifests. |
| `SENTIMENT_ANALYSIS` | Yes | 19 | Implemented locally with an optional Hugging Face CardiffNLP model. English three-way sentiment polarity only; provider scores are uncalibrated and emotion categories are not claimed. Not in manifests. |
| `DOCUMENT_AUTHENTICITY` | Yes | 12 | Deferred: no supported document signature parser, trust-anchor/revocation path, or independent timestamp/notarization source is present; caller-provided hashes/keys are insufficient to substantiate authenticity. |
| `ONCHAIN_METRIC_VERIFY` | Yes | 34 | Implemented locally for Ethereum mainnet receipt `gasUsed` at explicit block; single configured RPC source, not independently cross-checked. Kept out of manifests pending Integrate builder and saved-YAML validation. |
| `CONTRACT_OBLIGATION_AUDIT` | Yes | 13 | Deferred: the repo has no contract-aware parser or independent fulfillment records. Keyword extraction would not reliably resolve defined terms, cross-references, exceptions, amendments, or whether obligations were met. |
| `SLA_COMPLIANCE` | Yes | 11 | Implemented locally for uptime arithmetic from caller-supplied full-period measurement totals only; no monitoring data, response-time, or resolution-time checks. Kept out of both manifests. |
| `SHIPMENT_DELAY_RISK` | Yes | 10 | Deferred: no shipment/carrier/customs/port/weather integrations or calibrated historical delay outcomes are available; a forecast score would be unsupported. |
| `FRAUD_DETECTION` | Yes | 29 | Deferred: broad entity/transaction/action fraud probability has no defined domain, fraud-labeled outcomes, or calibrated evidence source here; adjacent cyber-reputation signals cannot be presented as fraud findings. |

Current order of work:

1. [x] Complete NEWS_SEARCH endpoint preparation and preserve the original 29-intent manifest gate. Remote Integrate validation remains blocked by its documented endpoint's 404 HTML response.
2. [x] Implement and test WEB_SEARCH using the verified Jina Search API; keep it local pending credentials and Integrate request-builder validation.
3. [x] Reverify TWITTER_SEARCH canonical status and implement/test a bounded optional X recent-search provider. Keep it local pending Integrate request-builder validation.
4. [x] Verify and implement SENTIMENT_ANALYSIS using a real, optional model provider; keep it local pending Integrate schema/request-builder validation.
5. [x] Assess DOCUMENT_AUTHENTICITY and implement the feasible narrow ONCHAIN_METRIC_VERIFY scope. DOCUMENT_AUTHENTICITY is deferred pending a supported signature format and independent trusted chain/timestamp verification source. ONCHAIN_METRIC_VERIFY uses a configured read-only Ethereum mainnet RPC and remains local pending Integrate request-builder and saved-YAML validation.
6. [x] Assess CONTRACT_OBLIGATION_AUDIT: keep deferred until a supported structured contract parser/grounded extraction path and trusted fulfillment evidence are available.
7. [x] Assess and implement a narrow SLA_COMPLIANCE uptime calculation using caller-supplied measurements; keep local and explicitly state data cannot be independently validated.
8. [x] Assess SHIPMENT_DELAY_RISK: defer until carrier/customs/port/weather feeds and arrival-ground-truth data support a calibrated forecast.
9. [x] Assess FRAUD_DETECTION: defer until a specific fraud domain, reliable fraud-labeled evidence, and validated/calibrated evaluation set are selected.
10. [x] Inspected all six Phase 1B concepts against the 134-entry live canonical registry; none is an exact canonical name. Recorded nearest equivalents, duplicate risks, and three differentiated internal proposal/evaluation/safety drafts in `.verity-work/PHASE1B_PROPOSALS.md`. Nothing was submitted or marked canonical.
11. Keep manifests unchanged until each candidate's route, request-builder mapping, response behavior, canonical name, and applicable validation gates are evidenced. Revisit remote validator recovery separately; its known 404 does not block local work but prevents claiming remote YAML validation passed.
12. [x] Finish the shared-endpoint Integrate configuration guide and local preflight review. Live Integrate request-builder/validator checks and registration remain separate manual steps; registration requires the user's explicit approval.

The live registry check confirms canonical names and counts, not that any intent is underserved or suitable for this miner. The Integrate screen fields described by the user are used as the dashboard field inventory; no screenshot file was present in the checkout. Telegraph's public docs explain generic params but not nested per-property schemas, so the exact `input.query` builder behavior remains a dashboard validation question.