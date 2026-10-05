# THREAT_INTELLIGENCE

`THREAT_INTELLIGENCE` is a Cybersecurity Hybrid Intent in the current Telegraph catalogue. citeturn0search0

## Scope

Verity accepts four indicator classes:

- IPv4 address
- domain
- HTTP(S) URL
- MD5, SHA-1, or SHA-256 hash

A configured intelligence source supplies exact indicator matches and their provenance.

## Result states

- Known threat match -> `confirmed`
- No known match -> `not_found`
- Invalid indicator -> `rejected`
- Missing or failed intelligence source -> `insufficient_evidence`

A no-match result is deliberately not presented as proof of safety.

## Architecture boundary

The source adapter is injected through `lookupImpl`. This keeps the Intent contract independent of any specific commercial or open threat feed and allows multiple sources to be combined later.
