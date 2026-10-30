# FACT_CHECK

`FACT_CHECK` is a Trust & Safety Hybrid Intent in the current Telegraph catalogue. citeturn0search0

## Scope

Verity delegates claim evaluation to a configured fact-checking source and normalizes the result into:

- `true`
- `false`
- `mixed`
- `unverified`

Evidence retains source identity, type, title, URL, excerpt, publication time when available, and retrieval time.

## Result states

- True, false, or mixed with evidence -> `confirmed`
- Unverified -> `insufficient_evidence`
- Empty claim -> `rejected`
- Missing or failed checker -> `insufficient_evidence`

The implementation does not turn absence of evidence into a false claim.
