# IMAGE_VERIFICATION

`IMAGE_VERIFICATION` is one of Verity's approved media Intents in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent delegates verification of a supplied image reference to a configured verification source. It is intentionally narrower than `DEEPFAKE_DETECTION` and `MEDIA_AUTHENTICITY_CHECK`.

Signals are:

- `verified`
- `mismatch`
- `indeterminate`

A verifier should provide concrete indicators explaining the result.

## Result states

- Verified -> `confirmed`
- Mismatch -> `likely`
- Indeterminate -> `insufficient_evidence`
- Empty input -> `rejected`
- Missing or failed verifier -> `insufficient_evidence`

Verification is scoped to the evidence and method used; it is not universal proof of image provenance.
