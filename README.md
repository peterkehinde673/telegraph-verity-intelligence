# Telegraph Verity Intelligence

Telegraph Verity Intelligence is a machine-callable intelligence provider designed for evidence, content authenticity, media verification, and digital-infrastructure security.

## Current Intent Scope

The working branch declares 22 Telegraph Intents. Each intent should only be advertised as production-capable when its handler, provider configuration, and tests are complete:

### Evidence & Research
1. FACT_CHECK
2. RESEARCH_QUERY
3. RESEARCH_SYNTHESIS
4. NEWS_HEADLINES
5. ACADEMIC_SEARCH
6. CONTENT_EXTRACTION
7. CONTENT_VERIFICATION

### Authenticity & Media
8. TEXT_AUTHENTICITY_CHECK
9. AI_TEXT_DETECTION
10. DEEPFAKE_DETECTION
11. MEDIA_AUTHENTICITY_CHECK
12. IMAGE_VERIFICATION
13. VIDEO_VERIFICATION

### Safety
14. CONTENT_MODERATION

### Web & Cybersecurity
15. URL_SCAN
16. EMAIL_SECURITY
17. MALWARE_DETECTION
18. CVE_LOOKUP
19. SSL_VERIFICATION
20. DNS_RECORD_LOOKUP
21. CODE_REVIEW — bounded static heuristics for supplied source code/diffs
22. URL_SAFE — Google Safe Browsing reputation lookup (requires API-key configuration)

## Design Principles

- Use only canonical Telegraph Intent names verified against the current Intent catalogue.
- Do not invent Telegraph protocol fields, IDs, or registration requirements.
- Do not reuse the Sentinel miner ID.
- Do not guess a Miner ID; verify registration state before registration.
- Keep evidence reproducible and provenance explicit.
- Prefer abstention over unsupported conclusions.
- Keep deterministic outputs normalized and evaluator-friendly.
- Separate the Miner service from any Evaluator/WASM implementation.
- Build and verify one logical change at a time.
- Use GitHub Actions for continuous verification.
- Target Render for production deployment.

## Project Status

- **Miner registration:** Registered on Telegraph as `telegraph-verity-intelligence`, Miner ID `5530`.
- **Public explorer:** https://explorer.telegraphprotocol.com/miners/telegraph-verity-intelligence
- **Production API:** https://telegraph-verity-intelligence-api.onrender.com
- **API status endpoints:** `GET /health` and `GET /intents`.
- **Intent implementation:** The working branch contains 22 intent handlers and tests. URL_SAFE requires `GOOGLE_SAFE_BROWSING_API_KEY` in the Render service environment; without it, the handler abstains with `insufficient_evidence` rather than claiming a URL is safe. CODE_REVIEW is bounded static heuristics, not a full semantic audit. The live deployment remains at 20 intents until this branch is merged and deployed.
- **Scoring module (WASM):** Not yet built or registered. Telegraph scoring modules are separate from Miner APIs and score one canonical Intent at a time; see the official [Build a Scoring Module guide](https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module).
- **CI/deployment:** GitHub Actions verifies typecheck, build, tests, and Telegraph tooling. Render is the production hosting target.

## Source of Intent Selection

The 20 Intent names are based on the current Telegraph Season II Intent catalogue. The catalogue is authoritative for the available Intent names; commercial mission usage is not treated as proof that an Intent has or has not previously been implemented by another Miner.

## Next Steps

1. Merge and deploy the reviewed Season II intent batch.
2. Configure `GOOGLE_SAFE_BROWSING_API_KEY` in Render before enabling URL_SAFE reputation checks.
3. Verify `GET /intents` and exercise each newly deployed intent.
4. Continue with the next evidence-backed intent batch, starting with plagiarism detection only after selecting a reliable comparison corpus.
