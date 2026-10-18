# Verity Intelligence — Season 2 Master Plan (Frozen)

**Objective:** Improve the existing miner's measured performance on the currently supported lower-performing intent group, protect the first ten stable intents from regressions, then add carefully selected new intents and prepare a controlled re-registration/integration with the Telegraph dashboard.

**Season status:** Season 2 has not started. This plan is preparation only until the season opens.

## Scope and guardrails

- The first ten stable intents are a protected set. Do not intentionally change their handlers, scoring behavior, prompts, response schemas, or shared logic unless a critical correctness/security fix requires it. Any shared change must have regression coverage proving no adverse impact on this protected set.
- Focus optimization batches on the currently supported intents outside that protected first-ten set, prioritizing the weakest observed scores and ranks from the Explorer, not guesses.
- Read screenshot scores using subscript-style digits as decimal places. Example: `0.₃₇₁ = 0.000371`. Keep raw screenshot transcription separate from normalized numeric values; flag unclear digits instead of guessing.
- Leave FACT_CHECK/WASM scorer implementation and calibration alone. Do not run another scorer experiment unless the user separately asks.
- No score inflation, fabricated evidence, unsafe confidence, weakening of security controls, or unsupported claims of leaderboard improvement.
- Work in small batches; validate each batch before proceeding. Keep `.verity-work/PROGRESS.md` concise and record only current decisions, verified results, blockers, and key commits/CI links.
- Do not deploy, register/re-register, submit on-chain transactions, publish releases, or change production configuration until code validation is complete and the user explicitly authorizes the external action.
- Never commit credentials or private evaluation answers. The public repository is not a secret store.

## Batch 0 — Replace prior-phase plan and establish current baseline
- [x] Replace the previous phase plan with this Season 2 plan; do not resume the old A–H sequence.
- [x] Keep only important current state in the progress log and remove stale narrative/repeated historical detail.
- [ ] Complete score transcription for the screenshot; preserve raw subscript notation and mark unclear digits instead of guessing. Current snapshot records the clearly legible ranks/zero scores only.
- [x] Confirm the first-ten protected intents from the repository's canonical `src/intents/catalogue.ts`; verify live registration separately before any external update.

## Batch 1 — Rank the unprotected intents
- [x] Inventory all 29 catalogue intents, handler wiring, and available intent-focused tests; score transcription remains partial where screenshot digits are ambiguous.
- [x] Exclude the protected first ten (catalogue positions 1–10) from optimization work.
- [x] Select the first inspection batch from catalogue positions 20–22: `DNS_RECORD_LOOKUP`, `CODE_REVIEW`, and `URL_SAFE`; validate actual code/test gaps before modifying handlers.
- [x] Do not alter an intent just because its score is low; identify whether the cause is handler behavior, evidence quality, response schema, availability, or evaluator behavior. First inspected DNS_RECORD_LOOKUP, CODE_REVIEW, and URL_SAFE; existing tests cover core cases and no source change is justified yet.

## Batch 2 — Improve the lowest-performing intent batch
- [ ] Add/confirm regression cases for correct, incorrect, ambiguous, empty, malformed, and adversarial inputs where relevant. First inspection batch found no sufficiently evidenced handler defect to justify a code change.
- [ ] Make the smallest evidence-backed application-side change per intent.
- [ ] Preserve abstention behavior, provenance, response contracts, SSRF protections, and all other security boundaries.
- [ ] Run typecheck, build, full tests, integration tooling, and miner-template preflight.
- [ ] Verify protected first-ten behavior remains unchanged through targeted regression tests. If a shared dependency changes, expand coverage before acceptance.
- [ ] Record before/after test evidence. Unit-test success is not proof of a protocol-score gain.

## Batch 3 — Iterate over remaining unprotected intents
- [ ] Repeat Batch 1–2 in small batches until all currently supported intents outside the protected first ten have been reviewed.
- [ ] Prefer measured correctness improvements; reject speculative changes and any candidate that causes a protected-intent regression.
- [ ] Leave WASM/scorer code unchanged.

## Batch 4 — Add new intents
- [ ] Identify useful new intent categories not already supported and check provider/data availability, contract design, costs, security, and maintenance burden.
- [ ] Propose a small first group of new intents with explicit input/output schemas and evidence requirements.
- [ ] Implement each new intent with dispatcher/manifest wiring, focused tests, documentation, and failure/abstention handling.
- [ ] Verify existing intents, especially the protected first ten, remain unaffected.
- [ ] Do not add an intent unless it can provide defensible evidence and can be tested reliably.

## Batch 5 — Pre-registration and dashboard integration readiness
- [ ] Verify the miner manifest, supported-intent declaration, response schema, endpoint health, and dashboard integration requirements against current official instructions.
- [ ] Confirm the dashboard reflects the intended miner and supported intents in a non-production/test path where available.
- [ ] Resolve manifest/integration issues and rerun all required checks.
- [ ] Prepare a re-registration checklist with the exact intended changes, risks, and rollback/recovery steps.
- [ ] Do not perform live registration or production integration without separate explicit approval.

## Batch 6 — Season 2 launch gate and measured follow-up
- [ ] Wait for Season 2 to start before treating season performance as measurable.
- [ ] After explicit user approval, register/re-register and integrate through the official Telegraph flow.
- [ ] Verify the live miner identity, supported intents, request health, and first scored epoch.
- [ ] Compare observed scores/ranks to the recorded baseline using the correct subscript decimal notation.
- [ ] Fix regressions promptly; do not claim improvement unless the live data shows it.

## Final acceptance criteria

- All changes are small, reviewable, tested, and documented.
- The protected first ten intents have no unexplained regressions.
- Lower-performing existing intents have evidence-backed quality improvements or are explicitly documented as blocked.
- New intents are wired, tested, and evidence-capable before being declared complete.
- Manifest/dashboard readiness is verified, and external registration remains gated by explicit approval.
- Season 2 scoring is reported only after Season 2 starts and real measurements are available.

**Freeze rule:** This plan is the active Season 2 baseline. Update task status in `.verity-work/PROGRESS.md`; change this plan only if the user explicitly revises the objective or scope.
