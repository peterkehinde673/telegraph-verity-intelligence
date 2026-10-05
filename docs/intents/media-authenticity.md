# MEDIA_AUTHENTICITY_CHECK

`MEDIA_AUTHENTICITY_CHECK` is a Trust & Safety Non-deterministic Intent in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent checks available media provenance and integrity signals. It is intentionally separate from `DEEPFAKE_DETECTION`: provenance checks examine available integrity metadata and chain-of-custody signals, while deepfake detection is a media-manipulation classifier.

Signals are:

- `provenance_consistent`
- `provenance_inconsistent`
- `indeterminate`

## Result states

- Provenance consistent -> `confirmed`
- Provenance inconsistent -> `likely`
- Indeterminate -> `insufficient_evidence`
- Empty input -> `rejected`
- Missing or failed verifier -> `insufficient_evidence`

A provenance result is evidence about the available integrity information, not absolute proof that media is genuine.
