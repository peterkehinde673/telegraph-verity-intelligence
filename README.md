# Telegraph Verity Intelligence

Telegraph Verity Intelligence is a machine-callable intelligence provider designed for evidence, content authenticity, media verification, and digital-infrastructure security.

## Current Intent Scope

The active `miner.yaml` advertises the original 29 Telegraph Intents. This feature branch's local API catalogue contains 35; the six expansion candidates remain gated and are not registered. The list below describes the active manifest. Each intent should only be advertised as production-capable when its handler, provider configuration, and tests are complete:

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

- **Miner registry presence:** The project has a recorded miner slug `telegraph-verity-intelligence` and Miner ID `5530`; the automated live-registry check only confirms catalogue presence/activation.
- **Dashboard registration is separate:** Changes to `miner.yaml.template` or repository intent handlers do not update the registered miner configuration. After changing the intent list or endpoint schema, validate the final `miner.yaml` and submit/register the updated YAML through the Telegraph Integrate dashboard. Then verify the dashboard result and Explorer's displayed intent list. A passing registry-presence check is not proof that the updated YAML is registered.
- **Public explorer:** https://explorer.telegraphprotocol.com/miners/telegraph-verity-intelligence
- **Production API:** https://telegraph-verity-intelligence-api.onrender.com
- **API status endpoints:** `GET /health` and `GET /intents`.
- **Intent implementation:** The 29-intent Season II batch is merged into `foundation/verity-20-intents` and deployed to Render. The service build and startup succeeded; verify the live count using `GET /intents`. URL_SAFE requires `GOOGLE_SAFE_BROWSING_API_KEY`, THREAT_IP_REPUTATION requires `ABUSEIPDB_API_KEY`, and THREAT_INTELLIGENCE requires `OTX_API_KEY` in the Render service environment. Without a required key, each handler abstains with `insufficient_evidence` rather than inventing a reputation result. CODE_REVIEW is bounded static heuristics, not a full semantic audit.
- **Scoring module (WASM):** Not yet built or registered. Telegraph scoring modules are separate from Miner APIs and score one canonical Intent at a time; see the official [Build a Scoring Module guide](https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module).
- **CI/deployment:** GitHub Actions verifies typecheck, build, tests, and Telegraph tooling. Render is the production hosting target.

## Source of Intent Selection

The active 29-intent manifest is in `miner.yaml`; the feature branch's 35-entry local API catalogue is in `src/intents/catalogue.ts`. Confirm current Telegraph protocol availability against the official catalogue before registering or advertising additional intents; commercial mission usage is not treated as proof that an Intent has or has not previously been implemented by another Miner.

## Next Steps

1. Run `npm run smoke:render` to verify live health, the expected intent catalogue, and response contracts for safe validation requests to all seven Season II handlers. The expected count defaults to 29 for the active service; set `VERITY_EXPECTED_INTENT_COUNT=35` only when checking a reviewed feature deployment. The production health and catalogue endpoints have been manually confirmed by the project owner; the automated POST checks should be monitored in GitHub Actions.
2. Configure `GOOGLE_SAFE_BROWSING_API_KEY`, `ABUSEIPDB_API_KEY`, and `OTX_API_KEY` in Render if provider-backed reputation results are required; without these, the handlers abstain with `insufficient_evidence`.
3. Configure `REGRESSION_ALLOWED_HOSTS` before using REGRESSION_VERIFY; it only executes read-only GET probes. CODE_PATCH_VERIFY uses the public GitHub Checks API; configure `GITHUB_TOKEN` only if higher API rate limits are needed.
4. Register the final `miner.yaml` through the Telegraph Integrate dashboard whenever the declared intents or endpoint configuration changes; verify the dashboard's registration/update result and confirm Explorer shows the same 29 intents.
5. Expand plagiarism checking only after adding a reliable, permissioned comparison corpus and measuring false positives/negatives.
