# TEXT_AUTHENTICITY_CHECK

`TEXT_AUTHENTICITY_CHECK` is a Trust & Safety Hybrid Intent in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent evaluates supplied text against an injected authenticity-analysis source. Verity does not equate writing style, fluency, or a model's confidence with proof of authorship.

The normalized signal is one of:

- `consistent`
- `inconsistent`
- `unknown`

## Result states

- Consistent signal -> `confirmed`
- Inconsistent signal -> `likely`
- Indeterminate signal -> `insufficient_evidence`
- Empty input -> `rejected`

The provider must supply concrete indicators when it makes an authenticity assessment.
