# TELEGRAPH HACKATHON SEASON II — FROZEN MASTER PLAN

**Status:** Frozen scope; owner approval is required to change this plan.  
**Repository:** https://github.com/peterkehinde673/telegraph-verity-intelligence  
**Known engineering release:** `e43d60cef64b6b937b738b992a7b57f0c8e06025`  
**Engineering branch reviewed:** `verity/score-improvements-batch-1`  
**Miner slug / ID:** `telegraph-verity-intelligence` / `5530`  
**Production API:** https://telegraph-verity-intelligence-api.onrender.com

## 1. Mandatory operating rules

1. This file is the single forward plan. Do not create a competing roadmap.
2. Do not repeat completed engineering work just because an old note says it is pending. Check the repository, commit history, tests, workflows, deployment and official platform evidence first.
3. Do not treat local implementation, a candidate YAML, or a successful build as proof of live registration, accepted configuration, routed requests, ranking or eligibility.
4. Preserve the existing work. No broad refactor, intent expansion, new feature batch, or second product without the owner's explicit approval.
5. Keep three tracks visible—Providers, Apps & Agents, Evaluators—but select one primary track based on the current official Season II missions. Do not build all three in parallel.
6. No fake usage, fabricated evaluation results, request-counter manipulation, or false claims about payments, ranking or quality.
7. No production inference POST, dashboard registration/re-registration, manifest swap, scorer upload, or on-chain transaction during the read-only audit. Any such action requires an explicit, separate approval after its exact effect is explained.
8. Never expose secrets or copy credentials into repository files, logs, plans or reports.
9. Update `PROGRESS.md` only with evidence-backed status. Preserve corrections and history rather than silently rewriting reality.
10. If a fact cannot be verified, label it **unknown** and identify the exact evidence needed. Do not turn unknowns into coding tasks by default.

## 2. Repository inventory already found — do not rebuild

The engineering branch reviewed at `e43d60c` already contains substantial implementation. Treat these as existing assets to inspect/reuse, not new tasks:

### Provider/API foundation
- TypeScript HTTP API with `GET /health`, `GET /intents`, and `POST /v1/intent`.
- Shared dispatcher, response contract validation, evidence normalization/provenance utilities, configuration, and normalized response fields.
- 35 names in `src/intents/catalogue.ts` and corresponding intent modules/tests across research, content verification, media authenticity, safety, cybersecurity, news/web/social search, sentiment, on-chain metric verification, and SLA calculation.
- Provider adapters include public-source retrieval, Jina Reader/Search, Google Fact Check, Hugging Face sentiment, Ethereum RPC, CISA KEV, MalwareBazaar, and X search. Some external integrations require credentials or have bounded coverage.
- A broad suite of intent/provider/API contract tests and CI workflows.
- Adapter hardening already completed in commits:
  - response contract: `5d5e3d6789bb69e20d171c91f313f884e1e3c54c`
  - URL_SAFE: `87abfb8dc4cf6a374e492b34c2e2b4728218c943`
  - MalwareBazaar attribution: `e43d60cef64b6b937b738b992a7b57f0c8e06025`

### Intent manifests — important exact distinction
- `miner-integrate-candidate.yaml` already contains a **35-intent candidate**: the 29 established entries plus `NEWS_SEARCH`, `WEB_SEARCH`, `TWITTER_SEARCH`, `SENTIMENT_ANALYSIS`, `ONCHAIN_METRIC_VERIFY`, and `SLA_COMPLIANCE`.
- The version of `miner.yaml` and `miner.yaml.template` inspected on branch `verity/score-improvements-batch-1` still declares the original **29 intents**.
- Therefore, do **not** implement these six handlers again. First determine which YAML is the intended/current submission artifact, whether the 35-intent candidate was validated and accepted, and what is actually registered in the Telegraph dashboard/Explorer. A candidate file is not proof of accepted live registration.
- The branch README and integration guide also describe the 35 local catalogue / 29 manifest split and say dashboard/request-builder validation was unresolved at the time those docs were written. Those notes may be stale; verify current evidence before acting.
- Do not modify any YAML during the audit.

### Evaluator/scoring work already present
- `wasm/verity-fact-check-scorer/` exists as a Rust FACT_CHECK scorer prototype using deterministic lexical-overlap token precision/recall F1. Its own README explicitly says lexical overlap is not semantic fact verification and that it should not be registered without benchmark evidence.
- `.github/workflows/wasm-scorer.yml` builds/tests the standalone WASM module and checks its ABI/size/import constraints.
- `.github/workflows/fact-check-eval-harness.yml` contains a benchmark/evaluation workflow that compares scorer builds and captures public Telegraph scorer/score endpoints.
- `eval-artifacts/public-cases/fact-check.json` and related documentation exist.
- Consequently, “build a WASM scorer from scratch” and “create an evaluation harness from scratch” are **not** next steps. The open question is whether this existing prototype/evaluation evidence satisfies a current official Evaluator mission and whether its benchmark results justify any further work. Do not upload/register it without owner approval.

### Release evidence already recorded
- Final code commit: `e43d60cef64b6b937b738b992a7b57f0c8e06025`.
- GitHub Actions run `40754411719` was reported successful with typecheck/build and 336 tests passing.
- Render deployment `dep-dbh60n0mkps73dcebcg` was reported live on that SHA; read-only `GET /health` and `GET /intents` returned HTTP 200, with 35 local runtime intents.
- These are recorded release facts, not proof of the current dashboard registration, end-to-end Telegraph request construction, mission eligibility, scorer quality, or competition success. Re-check only if a decision depends on current state.

## 3. Immediate next step — read-only Season II decision audit

Do **not** code yet. Inspect the latest official Season II announcement, all three tracks and their actual missions, eligibility/submission requirements, current deadlines, scoring/judging criteria, and any purchase/payment or registration requirements. Then reconcile that with the repository and official live platform state.

Create/update `docs/SEASON2_READINESS_AUDIT.md` with:
- Official URLs and date checked.
- Each relevant mission and its exact mandatory deliverables, judging criteria, eligibility, deadline and submission evidence.
- Current miner registration and dashboard/Explorer intent list, including timestamp and evidence links. Distinguish registry presence from the registered configuration.
- YAML state table for `miner.yaml`, `miner.yaml.template`, and `miner-integrate-candidate.yaml`: count, purpose, validation status, and whether each was submitted/accepted.
- The 35-intent implementation map: handler exists, provider dependency, credentials/config needed (names only), tests, known limitations and whether relevant to a selected mission.
- Existing scorer prototype and evaluation workflow status, actual available benchmark output, comparison methodology, limitations, and whether an official Evaluator mission requires them.
- Which parts of the Apps & Agents track can reuse this provider and what is missing for a real end-to-end app.
- Facts vs assumptions, blockers, mission-fit comparison, recommendation and smallest viable deliverable.

If official rules or live registration cannot be verified, document the blocker and stop. Do not “fix” manifests based on assumptions.

## 4. Three track plans — reuse first

### Track A — Providers
**Existing base:** 35-entry local catalogue, 35-intent candidate YAML, 29-intent active manifest on the reviewed engineering branch, handlers, providers, evidence contract, tests and registration/preflight scripts.

**Potential remaining work, only if the audit proves it is needed:**
1. Verify the exact current official mission and provider acceptance requirements.
2. Verify the 35-intent candidate YAML and live dashboard/Explorer configuration; do not rewrite the six already implemented handlers.
3. Review validation output and request-builder compatibility for the 35-intent candidate. The previous guide reports that the documented validator endpoint returned HTTP 404; verify current behavior rather than assuming it remains broken.
4. Identify only mission-critical gaps in real provider configuration, attribution, abstention, safety, or reproducibility.
5. After owner approval, make the smallest necessary correction, test, validate, and document it.
6. Prove actual mission-relevant routing/behavior through an authorized test path.

**Acceptance:** official mission fit is clear; intended configuration is accepted/registered; selected intents work with attributable evidence and safe abstention; mission-specific integration and demo are reproducible.

### Track B — Apps & Agents
**Candidate concept, not pre-approved:** a Verity Risk Brief workflow using an existing registered provider through the official Telegraph call path. The workflow accepts a user query/URL/indicator, calls the relevant provider, and presents a useful evidence-backed brief with sources, uncertainty and next steps.

**Only proceed if a current mission fits.**
1. Identify exact mission, user and problem from official criteria.
2. Prove how the app must discover/call a provider and whether machine-to-machine purchase/payment is mandatory.
3. Reuse the existing provider and intent; build only the smallest missing user-facing workflow.
4. Test success, invalid input, no evidence, provider unavailable and uncertainty.
5. Capture genuine integration/demo evidence; never fake requests or payments.

**Acceptance:** one reproducible end-to-end workflow, real Telegraph integration, useful output, visible failure/uncertainty handling, and all mission submission criteria satisfied.

### Track C — Evaluators
**Existing base:** Rust FACT_CHECK WASM scorer prototype, build/ABI workflow, evaluation workflow and public evaluation case file.

**Only proceed if a current official Evaluator mission fits.**
1. Read current official evaluator contract and mission rubric.
2. Inspect existing workflow artifacts/results and compare the scorer against the actual champion/default baseline, using valid, reproducible evaluation—not just compilation.
3. Determine whether the mission requires a scorer, a dataset, evaluation analysis, or another specific artifact.
4. Identify known weaknesses: lexical overlap is not semantic truth checking and may reward superficial word overlap.
5. Only after owner approval, improve or extend the existing artifact to address a demonstrated benchmark weakness; do not rebuild the crate or harness.
6. Keep scorer/WASM separate from the Miner API and do not register/upload it without explicit approval.

**Acceptance:** official evaluator contract is satisfied; reproducible benchmark evidence supports the claims; weaknesses and gaming risks are reported; registration/upload requirements are independently verified.

## 5. Track selection
Score each track 0–5 against documented evidence:
- official mission fit;
- reuse of completed work;
- certainty of eligibility and required integration;
- feasible delivery by one builder before the deadline;
- meaningful differentiation;
- ability for judges to reproduce/evaluate the result.

Select **one primary track**. A second track is allowed only when it directly supports the same entry and adds little extra scope. If mission/eligibility fit is unproven, resolve that before coding.

## 6. Frozen phases and decision gates

- **Phase 0 — Baseline inventory:** confirm reviewed branch/SHA, worktree status, manifests and candidate file, existing tests/workflows, release evidence. No changes.
- **Phase 1 — Official mission review:** collect current official requirements for Providers, Apps & Agents and Evaluators. No implementation.
- **Phase 2 — Live-state reconciliation:** check current registration, accepted intent list, candidate validation and relevant existing scorer/evaluation evidence. No manifest or production changes.
- **Gate 1:** publish the readiness audit with proven facts, unknowns and track scores.
- **Phase 3 — Owner decision:** recommend one primary track and one bounded deliverable with measurable acceptance tests. Wait for explicit owner approval.
- **Phase 4 — Minimal implementation:** only the approved gap; dedicated branch; no unrelated feature batch; test, typecheck, build and CI.
- **Phase 5 — Authorized integration evidence:** after explaining side effects and receiving approval, verify the real official integration and mission behavior.
- **Phase 6 — Submission freeze:** prepare reproducible demo, required materials, evidence, limitations, final SHA and submission confirmation. No new features.

## 7. Definition of done
A working build or live health endpoint is not enough. The selected entry is done only when the official mission is identified, eligibility and registration/integration are verified, the required deliverable meets its acceptance criteria, genuine evidence is reproducible, all submission items are complete, and limitations are disclosed.

## 8. First authorized action
Perform **Phase 0–2 only** and produce `docs/SEASON2_READINESS_AUDIT.md`. Do not re-implement the 35 local intents, recreate the WASM scorer/harness, edit YAML, deploy, register, or send production inference POST requests. Stop for the owner's track decision.

**Frozen-plan rule:** report proposed changes separately; never silently expand or rewrite this plan.