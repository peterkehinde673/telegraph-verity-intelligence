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
- [ ] Verify current canonical registry and miner coverage for Phase 1A candidates.
- [ ] Select and implement Batch A; no expansion intent has been added to `miner.yaml` yet.
- [ ] Prepare selected Phase 1B proposals and obtain canonical confirmation before implementation/manifest changes.
- [ ] Complete manifest integration, preflight and regression checks.
- [ ] Obtain separate explicit approval before live Integrate dashboard registration/update.
