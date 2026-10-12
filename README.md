# Telegraph Verity Intelligence

Telegraph Verity Intelligence is a machine-callable intelligence provider designed for evidence, content authenticity, media verification, and digital-infrastructure security.

## Current Intent Scope

The working branch declares 29 Telegraph Intents. Each intent should only be advertised as production-capable when its handler, provider configuration, and tests are complete:

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
23. THREAT_IP_REPUTATION — AbuseIPDB IP reputation (requires API-key configuration)
24. THREAT_INTELLIGENCE — AlienVault OTX pulse lookup for IPs, domains, URLs, or SHA-256 hashes (requires API-key configuration)
25. PLAGIARISM_DETECTION — compares supplied text against a caller-provided reference corpus using five-word overlap shingles; not an internet-wide search
26. SECURITY_REVIEW — bounded static security heuristics for source/configuration; not a full audit or dependency scan
27. REGRESSION_VERIFY — read-only allowlisted HTTPS GET probes with response assertions; not a test-suite/build runner
28. CODE_PATCH_VERIFY — verifies GitHub CI check-run outcomes for a supplied commit SHA; does not execute code itself
29. VULNERABILITY_TRIAGE — transparent rule-based ranking of supplied vulnerability findings by CVSS/severity, known exploitation, asset criticality and internet exposure; no external feeds queried

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
- **Intent implementation:** The 29-intent Season II batch is merged into `foundation/verity-20-intents` and deployed to Render. The service build and startup succeeded; verify the live count using `GET /intents`. URL_SAFE requires `GOOGLE_SAFE_BROWSING_API_KEY`, THREAT_IP_REPUTATION requires `ABUSEIPDB_API_KEY`, and THREAT_INTELLIGENCE requires `OTX_API_KEY` in the Render service environment. Without a required key, each handler abstains with `insufficient_evidence` rather than inventing a reputation result. CODE_REVIEW is bounded static heuristics, not a full semantic audit.
- **Scoring module (WASM):** Not yet built or registered. Telegraph scoring modules are separate from Miner APIs and score one canonical Intent at a time; see the official [Build a Scoring Module guide](https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module).
- **CI/deployment:** GitHub Actions verifies typecheck, build, tests, and Telegraph tooling. Render is the production hosting target.

## Source of Intent Selection

The 20 Intent names are based on the current Telegraph Season II Intent catalogue. The catalogue is authoritative for the available Intent names; commercial mission usage is not treated as proof that an Intent has or has not previously been implemented by another Miner.

## Next Steps

1. Confirm the live `GET /health` and `GET /intents` responses and exercise each deployed intent.
2. Configure `GOOGLE_SAFE_BROWSING_API_KEY`, `ABUSEIPDB_API_KEY`, and `OTX_API_KEY` in Render if provider-backed reputation results are required; without these, the handlers abstain with `insufficient_evidence`.
3. Configure `REGRESSION_ALLOWED_HOSTS` before using REGRESSION_VERIFY; it only executes read-only GET probes. CODE_PATCH_VERIFY uses the public GitHub Checks API; configure `GITHUB_TOKEN` only if higher API rate limits are needed.
4. Expand plagiarism checking only after adding a reliable, permissioned comparison corpus and measuring false positives/negatives.
