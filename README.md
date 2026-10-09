# Telegraph Verity Intelligence

Telegraph Verity Intelligence is a machine-callable intelligence provider designed for evidence, content authenticity, media verification, and digital-infrastructure security.

## Initial Intent Scope

Verity will target these 20 Telegraph Intents:

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
- **Intent implementation:** The 20-intent catalogue and common response contract exist, but each intent still needs a real, evidence-backed handler. An intent listed by the API must not be described as production-capable until its handler and tests are complete.
- **Scoring module (WASM):** Not yet built or registered. Telegraph scoring modules are separate from Miner APIs and score one canonical Intent at a time; see the official [Build a Scoring Module guide](https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module).
- **CI/deployment:** GitHub Actions verifies typecheck, build, tests, and Telegraph tooling. Render is the production hosting target.

## Source of Intent Selection

The 20 Intent names are based on the current Telegraph Season II Intent catalogue. The catalogue is authoritative for the available Intent names; commercial mission usage is not treated as proof that an Intent has or has not previously been implemented by another Miner.

## Next Steps

1. Establish the TypeScript service foundation.
2. Add repository-wide validation and CI.
3. Define the internal Verity response/evidence contract.
4. Verify the live canonical Intent set and Miner registration state before Telegraph registration work.
5. Implement Intents incrementally with tests and provenance requirements.
