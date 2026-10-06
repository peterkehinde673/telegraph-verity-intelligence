# CONTENT_VERIFICATION

`CONTENT_VERIFICATION` is an approved current Telegraph Intent. citeturn0search0

## Scope

This Intent verifies supplied content against an explicitly configured verification source. It is distinct from:

- `CONTENT_EXTRACTION`: retrieves content without judging it;
- `CONTENT_MODERATION`: assesses safety or policy categories;
- `FACT_CHECK`: evaluates a claim as true, false, mixed, or unverified.

Signals are:

- `verified`
- `mismatch`
- `indeterminate`

A verification signal is not accepted as confident unless supporting evidence is present.

## Result states

- Verified with evidence -> `confirmed`
- Mismatch with evidence -> `likely`
- Indeterminate -> `insufficient_evidence`
- Verification result without evidence -> `insufficient_evidence`
- Empty content -> `rejected`
- Missing or failed verifier -> `insufficient_evidence`

Verification is scoped to the supplied content, comparison method, and evidence returned by the configured verifier.
