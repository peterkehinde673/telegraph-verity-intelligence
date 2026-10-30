# VIDEO_VERIFICATION

`VIDEO_VERIFICATION` is one of Verity's approved media Intents in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent delegates verification of a supplied video reference to a configured verification source. It is intentionally distinct from `DEEPFAKE_DETECTION`: verification checks a defined reference or integrity criterion, while deepfake detection estimates likely manipulation.

Signals are:

- `verified`
- `mismatch`
- `indeterminate`

## Result states

- Verified -> `confirmed`
- Mismatch -> `likely`
- Indeterminate -> `insufficient_evidence`
- Empty input -> `rejected`
- Missing or failed verifier -> `insufficient_evidence`

Verification is scoped to the evidence and method used; it is not universal proof of video provenance.
