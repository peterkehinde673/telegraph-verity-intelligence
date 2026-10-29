# TELEGRAPH HACKATHON SEASON II — FROZEN MASTER PLAN

**Project:** Telegraph Verity Intelligence  
**Repository:** https://github.com/peterkehinde673/telegraph-verity-intelligence  
**Production API:** https://telegraph-verity-intelligence-api.onrender.com  
**Known Miner ID:** `5530`  
**Known release commit:** `e43d60cef64b6b937b738b992a7b57f0c8e06025`  
**Status:** FROZEN — no scope or phase changes without the owner's explicit approval.

## 0. Frozen-plan rules

1. This is the single source of truth. Do not create a competing roadmap.
2. Codex must not add phases, tracks, features, intents, dependencies, infrastructure, or “nice-to-have” improvements outside this plan.
3. Do not rewrite this plan to make work appear complete. Update `PROGRESS.md` only when completion is evidenced.
4. Evidence before implementation: inspect current official Season II rules, docs, missions, platform v2 registration, and repository state first.
5. Read-only discovery first. Do not change code, manifests, registration, Render settings, or production configuration without explicit owner approval.
6. Do not send production inference POST requests during discovery unless the owner separately approves the exact request and potential side effects.
7. Never infer registration, eligibility, routing, ranking, or quality from a successful build, health check, `/intents` response, repository manifest, or registry-presence check alone.
8. Never fabricate or manipulate Explorer request counters, usage, ranking, evaluation data, or purchase/payment activity.
9. Keep scoring/WASM separate from the miner API. Do not start an evaluator/scoring module unless an official mission and the owner explicitly authorize it.
10. Work in one bounded unit at a time, with tests and evidence. Stop at any blocked gate; report evidence and ask for the smallest necessary decision.
11. All three tracks are covered below, but that does not authorize building three products simultaneously. Choose one primary track from evidence.
12. Only the owner may approve a plan change. Codex may propose a change but must not silently apply it.

## 1. Known repository baseline — facts to verify

- The service exposes `GET /health`, `GET /intents`, and `POST /v1/intent`.
- `miner.yaml` declares Miner ID `5530`, slug `telegraph-verity-intelligence`, and the Render API URL.
- `miner.yaml` advertises **29 intents**, while `src/intents/catalogue.ts` contains **35**.
- The six additional local catalogue entries are `NEWS_SEARCH`, `WEB_SEARCH`, `TWITTER_SEARCH`, `SENTIMENT_ANALYSIS`, `ONCHAIN_METRIC_VERIFY`, and `SLA_COMPLIANCE`. Their presence in a local list does not prove implementation, official availability, or registration.
- The README warns that dashboard registration is separate from editing `miner.yaml`; registry presence alone does not prove the intended configuration is registered.
- Some integrations require provider keys, including Google Safe Browsing, AbuseIPDB, and AlienVault OTX. Missing credentials may lead to abstention.
- The last release report says commit `e43d60cef64b6b937b738b992a7b57f0c8e06025` was deployed to Render, with health and catalogue GETs returning HTTP 200 and the local catalogue reporting 35 intents. This proves basic API availability, not inference quality, live routing, or eligibility.
- Season II describes **Apps & Agents**, **Providers**, and **Evaluators**. Current mission-specific rules and judging criteria must be checked before selecting a deliverable.
- The project's previous focus includes research, evidence/content verification, media authenticity, and cybersecurity. This is a possible positioning, not proof that it matches a current commercial mission.

## 2. Immediate next decision: no coding yet

Perform a read-only **registration, eligibility, and mission-fit audit**. Answer:
1. Is Miner ID `5530` still registered after the v2 migration?
2. Does the current platform show the expected slug, endpoint, intents, and registration/update state?
3. Does the registered configuration match the intended repository configuration?
4. What official Season II missions exist, and what exact deliverables, integration/purchase requirements, judging criteria, deadlines, and submission evidence do they require?
5. Which mission genuinely needs intelligence this repository can supply?
6. Which intents have real handlers, tested integrations, required secrets configured, provenance, safe abstention, and mission-relevant quality evidence?
7. Which track is feasible for one builder and the remaining time?
8. What can be reused, what is only scaffolding, and what is missing?

### Gate A — required audit output

Produce `docs/SEASON2_READINESS_AUDIT.md` with:
- Official rules/docs URLs and date checked.
- Candidate missions, requirements, judging criteria, submission rules, and links.
- Current registration facts from the official platform, timestamps, and links/screenshots where available.
- Comparison of the 29-intent manifest and 35-entry local catalogue, listing the six extra names.
- For each mission-relevant intent: handler status, provider dependency, required secret (never reveal its value), tests, limitations, and quality evidence.
- Known deployment SHA and read-only health/catalogue observations, noting what these do **not** prove.
- Track recommendation, rationale, risks, unknowns, smallest viable deliverable, and stop/go decision.

**Acceptance:** facts and assumptions are clearly separated and the recommended track is justified. If official rules or registration cannot be verified, record the blocker and stop. Do not begin feature development.

## 3. Track plans

These are bounded paths to assess and, if selected, implement. They are not permission to build all tracks concurrently.

### Track 1 — Providers: make Verity a credible intelligence provider

**Goal:** dependable, mission-relevant intelligence, not merely a large intent list.

**Candidate deliverable**
- Correct current-v2 registration and provider configuration matching one mission.
- A narrow set of official, mission-relevant intents with a documented request/response contract.
- Real provider-backed results with attributable evidence, timestamps, uncertainty, and safe abstention when evidence or credentials are missing.
- Reproducible representative test cases and expected behavior.
- Operational evidence, authorized routing test, limitations, and concise demo.
- Honest limits for heuristics; do not market static checks as a full audit, deepfake detector, or internet-wide plagiarism search.

**Sequence after owner approval**
1. Confirm current v2 provider contract and registration.
2. Select only the minimum intents required for one mission.
3. Reconcile manifest, catalogue, handlers, provider configuration, docs, and registration only in an approved change.
4. Check configuration and required secrets without exposing secret values.
5. Test mission cases, malformed inputs, upstream errors, attribution, uncertainty, and abstention.
6. Run local tests and safe non-production integration tests.
7. Use an official/authorized end-to-end path only after documenting side effects and receiving required approval.
8. Prepare demo and reproducible evidence; stop when acceptance criteria pass.

**Acceptance criteria**
- Selected intents are currently supported and correctly registered.
- No selected advertised intent is a stub or fabricates success.
- Evidence is attributable to real sources.
- Missing keys, malformed provider data, rate limits, and empty results are safe.
- Mission-specific tests pass and limitations are documented.
- Another person can reproduce the demo.

### Track 2 — Apps & Agents: build a commercial workflow using Telegraph

**Goal:** solve one real user problem through a working application/agent and satisfy the official Telegraph integration requirements.

**Candidate direction, not approved yet:** a **Verity Risk Brief** workflow. A user submits a URL, claim, document, or security indicator; the app calls a suitable registered intelligence provider through the documented Telegraph mechanism; the app returns a concise evidence-backed brief with sources, uncertainty, and next steps. Replace this candidate if mission research identifies a better fit.

**Minimum deliverable**
- One specific user persona and commercial problem.
- One end-to-end flow with clear input, real Telegraph-routed intelligence request, useful output, and uncertainty handling.
- Minimal UI or CLI/demo.
- Error, timeout, no-evidence, and provider-unavailable states.
- Verifiable proof of required Telegraph integration and any mandated machine-to-machine purchase/payment.
- Representative tests and reproducible demo instructions.
- README covering value, architecture, setup, limitations, and reproduction.

**Sequence after owner approval**
1. Select one mission and verify qualification rules.
2. Define user, problem, success measure, and one happy path.
3. Verify official provider discovery/call and any purchase/payment process from current docs.
4. Build the smallest complete workflow, not a broad product.
5. Integrate only a verified provider/intent.
6. Test success, provider unavailable, invalid input, and no evidence.
7. Capture genuine demo evidence; never fake network activity or payments.
8. Stop when mission criteria and demo are satisfied.

**Acceptance criteria**
- User/problem and commercial value are clear.
- Workflow runs end-to-end reproducibly.
- Required Telegraph integration/purchase is real and verifiable.
- Output helps a user decide or act rather than only exposing raw JSON.
- Failures and uncertainty are visible.
- Demo and documentation match official rules.

### Track 3 — Evaluators: make intelligence quality measurable

**Goal:** create an evaluation contribution only if a current mission rewards it and its official contract is understood.

**Candidate deliverable**
- Versioned benchmark/test material with expected properties/outcomes, provenance, and reuse/licensing notes.
- Reproducible rubric for correctness, evidence quality, attribution, uncertainty, robustness, and safe abstention where relevant.
- Repeatable harness/report comparing outputs without rewarding unsupported confidence or fabricated evidence.
- A scoring module only if the mission explicitly requires one, built separately using the current official guide/toolchain.
- Results, failure cases, sample-size context, limitations, and reproduction instructions.

**Sequence after owner approval**
1. Confirm the exact evaluator mission and current official interface/contract.
2. Determine whether it needs evaluation material, a scoring implementation, or both.
3. Define measurable criteria and ground-truth requirements before coding.
4. Use only permitted data with documented provenance.
5. Validate a small set of labels manually before expanding it.
6. Test determinism, edge cases, and scoring loopholes.
7. If required, build and validate the scoring module separately from the miner API.
8. Publish reproducible materials and a limitations report.

**Acceptance criteria**
- Artifact matches the official mission and interface.
- Criteria are explicit and repeatable.
- Data permissions/provenance are documented.
- Results can be reproduced.
- Limitations and gaming risks are disclosed.
- Required scoring registration is verified separately from miner registration.

## 4. Track selection rule

After Gate A, score each track 0–5 using evidence, not enthusiasm or code volume.

| Criterion | Question |
|---|---|
| Official mission fit | Is there a specific mission this deliverable satisfies? |
| Existing-code reuse | Does the repository materially reduce work? |
| Qualification certainty | Can mandatory registration, integration, and submission rules be proven? |
| Feasibility | Can one person deliver it reliably before the deadline? |
| Differentiation | Is the value meaningfully better than a generic API/demo? |
| Evidence quality | Can judges reproduce and evaluate it? |

Choose **one primary track** with the strongest evidence-backed score. A supporting track is allowed only if it directly strengthens the same mission without becoming a second independent product. If qualification certainty is weak, resolve that first.

## 5. Frozen phases and gates

### Phase 0 — preserve baseline
Record repository/branch, latest known release SHA, production URL, Miner ID, manifest/catalogue, test command, and deployment evidence. Confirm working tree state before edits. Make no code or production changes.

**Gate 0:** baseline is recorded and the working release remains untouched.

### Phase 1 — extract official missions
Read current official rules and docs. Record mission requirements, qualification, judging, deadlines, deliverables, integration/payment requirements, and submission process. Separate facts from interpretation.

**Gate 1:** at least one concrete candidate mission and its mandatory criteria are evidenced. Otherwise stop.

### Phase 2 — registration and architecture audit
Check current v2 registration. Compare platform configuration with `miner.yaml` and local catalogue. Check selected handler/provider/test readiness. Define a safe authorized end-to-end test method; no production inference POST during discovery without explicit approval.

**Gate 2:** registration and the actual gap are evidenced, or a precise blocker/owner action is recorded.

### Phase 3 — select and freeze deliverable
Score all tracks, select one mission and primary track, define acceptance tests, non-goals, safety/rollback, and demo evidence. Obtain owner approval.

**Gate 3:** owner explicitly approves the bounded deliverable.

### Phase 4 — implement minimum viable entry
Use a dedicated feature branch. Make one logical change at a time. Add relevant tests. Run typecheck, build, all tests, and official validation. No unrelated intents, WASM, manifest, registration, or production-setting changes outside approved scope.

**Gate 4:** tests pass and review confirms scope compliance.

### Phase 5 — integration/evidence
Test safely outside production first. Use production only after exact test and side effects are documented and approved. Verify actual registration/routing/integration and mission behavior through supported official tools. Record timestamp, SHA, non-sensitive test inputs, outcomes, and limitations.

**Gate 5:** mission behavior is proven; health/catalogue checks alone are insufficient.

### Phase 6 — submission freeze
Prepare demo, setup instructions, architecture summary, test/evaluation evidence, limitations, and required submission material. Check every official requirement. Freeze features; fix submission-blocking defects only with approval. Record final SHA and submission evidence.

**Gate 6:** checklist is complete and evidence is reproducible.

## 6. Required project documents

- `MASTER_PLAN_FROZEN.md` — this document; immutable unless the owner explicitly approves a plan change.
- `PROGRESS.md` — verified completed items only, with evidence.
- `docs/SEASON2_READINESS_AUDIT.md` — factual findings from Phases 1–2, with links; not another competing plan.

## 7. Definition of done

The chosen entry is complete only when:
- A specific official mission is selected and its qualification rules are understood.
- Registration and integration requirements are satisfied and verified.
- The deliverable meets mission acceptance criteria.
- Evidence supports claims about real behavior and quality.
- Tests, demo, docs, and submission materials are complete.
- Final commit and deployment/submission state are recorded.
- Limitations are disclosed.
- No activity, metrics, evaluations, payments, or claims are fabricated.

A build, deployment, health check, or catalogue response alone is not competition completion.

## 8. First authorized action when work resumes

Perform **Phase 0, Phase 1, and Phase 2 only**. Do not implement features. Produce the readiness audit and recommend a primary track. Stop for owner approval before Phase 3 or any code, manifest, registration, deployment, or production behavior change.

**Frozen-plan declaration:** Codex and future sessions must follow this plan as written. They may report blockers or propose changes, but must not silently alter the plan or mark planned work complete.
