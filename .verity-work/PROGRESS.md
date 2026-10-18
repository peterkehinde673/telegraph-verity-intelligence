# Verity Work Progress — Season 2

Active plan: `.verity-work/MASTER_PLAN.md` (frozen Season 2 scope). Work in small validated batches. Keep the first ten catalogue intents protected. FACT_CHECK/WASM scorer is out of scope.

## Status

- [x] Plan reset; previous A–H phase superseded.
- [x] CI confirmed green by user for the plan/progress reset.
- [x] Latest application code/test CI run #735 passed: https://github.com/peterkehinde673/telegraph-verity-intelligence/actions/runs/39082141570
- [x] Deepfake correctness fix: `authentic_likely` returns `likely`; verdict confidence is direction-adjusted. Do not interpret this as a protocol-score gain.
- [x] Catalogue inventory: 29 intents wired in `src/intents/catalogue.ts` and `src/intent-handlers.ts`.
- [x] Protected first ten confirmed from canonical catalogue order: FACT_CHECK, RESEARCH_QUERY, RESEARCH_SYNTHESIS, NEWS_HEADLINES, ACADEMIC_SEARCH, CONTENT_EXTRACTION, CONTENT_VERIFICATION, TEXT_AUTHENTICITY_CHECK, AI_TEXT_DETECTION, DEEPFAKE_DETECTION. Do not intentionally modify them.
- [x] Batch 1 inspection: DNS_RECORD_LOOKUP, CODE_REVIEW, URL_SAFE and their tests reviewed. Existing tests cover key malformed/unconfigured cases; no reproducible source defect was established, so no handler change was made.
- [ ] Complete screenshot score transcription; clearly visible zero scores include DEEPFAKE_DETECTION rank #10, FACT_CHECK rank #15, CONTENT_EXTRACTION rank #17. Other subscript digits need careful reading; don't guess.
- [x] Batch 2 initial review: selected three handlers inspected; no evidence-backed change justified yet. Continue to positions 23–29 and revisit only when a concrete regression is found.
- [ ] Batch 3: review remaining catalogue positions 23–29 in small batches.
- [ ] Batch 4: propose and implement additional evidence-capable intents.
- [ ] Batch 5: validate miner YAML/manifest and dashboard integration readiness; no live changes yet.
- [ ] Batch 6: Season 2 has not started. Re-registration requires explicit approval and post-validation.

## Explorer baseline

User-provided screenshot: epoch 421; miner shown Active; 9 requests served; best rank #1; epochs participated 0. Treat subscript-style decimal digits as decimal places (example supplied by user: `0.₃₇₁ = 0.000371`). Only claim normalized values when the glyphs are clear.

## Guardrails

No WASM/scorer changes, score manipulation, unsupported claims, weakening security controls, deployment, registration, on-chain transactions, release publication, or production config changes without explicit authorization. Season 2 is not yet underway.
