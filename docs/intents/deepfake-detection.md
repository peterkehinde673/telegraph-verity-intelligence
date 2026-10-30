# DEEPFAKE_DETECTION

`DEEPFAKE_DETECTION` is a Trust & Safety Non-deterministic Intent in the current Telegraph catalogue. citeturn0search0

## Scope

Verity delegates media-manipulation analysis to an injected detector. The normalized media classes are image, video, audio, or unknown.

Signals are:

- `manipulated_likely`
- `authentic_likely`
- `indeterminate`

A detector may provide a manipulation probability and concrete indicators.

## Important limitation

This is probabilistic intelligence. An `authentic_likely` result does not prove that media is genuine, and a `manipulated_likely` result does not by itself establish who manipulated it.

## Result states

- Manipulated-likely -> `likely`
- Authentic-likely -> `confirmed`
- Indeterminate -> `insufficient_evidence`
- Empty input -> `rejected`
- Missing or failed detector -> `insufficient_evidence`
