# AI_TEXT_DETECTION

`AI_TEXT_DETECTION` is a dedicated text-analysis Intent in the current Telegraph catalogue. citeturn0search0

## Scope

Verity delegates AI-text classification to an injected detector and normalizes its output into:

- `ai_likely`
- `human_likely`
- `indeterminate`

The detector may provide an AI probability from 0 to 1 and concrete indicators.

## Important limitation

A detector score is probabilistic. It does not prove who authored the text, when it was created, or whether a human edited AI-generated content.

## Result states

- AI-likely -> `likely`
- Human-likely -> `confirmed`
- Indeterminate -> `insufficient_evidence`
- Empty input -> `rejected`
- Missing or failed detector -> `insufficient_evidence`

The provider is injected through `detectImpl` so the Intent contract is independent of a particular detection vendor.
