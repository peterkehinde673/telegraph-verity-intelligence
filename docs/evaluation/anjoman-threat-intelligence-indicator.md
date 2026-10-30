# Anjoman evaluation-material preparation

Anjoman is the Season II evaluation-material destination. Telegraph Integrate remains historical miner-registration/validation context and is not the submission destination for this work. The owner will submit through [Anjoman Evaluate](https://anjoman.ai/dashboard/eval); this repository does not sign or upload material.

## Current pilot

- Exact Intent: `THREAT_INTELLIGENCE_INDICATOR`, confirmed canonical by the live Telegraph registry and shown in the Anjoman selector by the owner.
- First contribution format: preference-pair JSONL, one object per line with exactly `prompt`, `chosen`, and `rejected`, following the interface format described by the owner.
- Truth source is a separate contribution path. Its Anjoman-specific schema is not exposed before sign-in and was not assumed from the preference-pair format.
- WASM scoring adapters are deferred.
- Acceptance, pool inclusion, rewards, and scoring are not guaranteed.
- Hidden evaluation pairs, labels, evidence mappings, and review notes stay in ignored local `private-evaluation/`; never commit them to public GitHub.

The unauthenticated public page at `https://anjoman.ai/dashboard/eval` returned HTTP 200 on 2026-10-30 but displayed “Sign in to see” the evaluation UI. Its private limits, preview behavior, Truth source requirements, and any signature flow were therefore not independently verified. The owner-provided UI description supplies the three-field preference-pair format used for this pilot. Do not claim that the local validator predicts Anjoman acceptance.

## Intent scope and limitations

The live canonical description says this Intent is for an IP address, domain, or other indicator queried for malicious reports in threat-intelligence feeds. It distinguishes URL safety scanning and file-hash malware verdicts into separate Intents. The local repository's legacy handler is named `THREAT_INTELLIGENCE`, accepts IP/domain/URL/SHA-256 and queries AlienVault OTX when configured. This pilot is limited to IPs and domains; it does not modify or claim to repair the existing route/manifest naming difference.

The private 18-pair pilot uses dated CISA/NSA/MS-ISAC and FBI/CISA/DC3 advisory observations plus IETF documentation-only ranges. It tests historical evidence attribution and abstention from unsupported current-status claims. It is not a current reputation feed benchmark; no OTX query or private API was used. See the ignored local evidence register and quality review for case-level rationale.

## Public sources

The source inventory and evidence scope are documented in [the source inventory](anjoman-threat-intelligence-indicator-sources.md). Sources were accessed read-only on 2026-10-30. CISA indicator values are normalized from defanged `[.]` notation in the source for use in prompts; the evidence record preserves the original presentation.

## Local validation

Run:

```sh
node scripts/validate-anjoman-eval.mjs \
  private-evaluation/threat-intelligence-indicator/anjoman-preference-pairs.jsonl \
  private-evaluation/threat-intelligence-indicator/evidence-register.json
```

This validates local JSONL structure, duplicates, private mapping completeness, and review metadata. It cannot authenticate source facts or guarantee Anjoman acceptance.
