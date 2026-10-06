# Telegraph Integration Readiness

## Current state

The application layer now contains the approved 20-Intent scope and the shared Verity response/evidence contract.

The Telegraph Miner YAML is intentionally **not** being registered yet.

The current Telegraph YAML standard requires a miner configuration to declare fields including:

- `version`
- `kind`
- `id`
- `slug`
- `name`
- `base_url`
- `semantics.supported_intents`

The supported Intents must be canonical Telegraph Intent strings. citeturn1search0

## Why registration is deferred

Two values must be real before a production Miner YAML can be finalized:

1. **A live Verity base URL** — the URL must point to the deployed API, not a placeholder.
2. **A verified unused Miner ID** — Verity must not reuse the Sentinel ID and must not guess an unused ID.

The protocol treats the Miner ID as part of the registered integration path, while the YAML declares the capabilities and endpoints. citeturn1search1

The live canonical Intent registry endpoint could not be independently read from this environment, so this project does not treat a locally copied list as proof of the current on-chain registry. The current official Intent catalogue remains the source used for scope selection, while live canonical verification is a pre-registration gate. citeturn1search0

## YAML rules we will follow

When registration work begins:

- Use only documented YAML fields.
- Do not add Sentinel-specific or invented fields.
- Do not put secrets in the YAML.
- Declare only the canonical Intents Verity actually serves.
- Use explicit endpoint mappings.
- Define signal mapping only with supported fields such as `confidence_field`, `label_field`, and `reason_field`.
- Validate the YAML against a running Telegraph node before registration. citeturn1search0

## Evaluator boundary

Verity's Miner implementation and any Evaluator/WASM implementation remain separate. Telegraph validators execute the canonical evaluation script associated with an Intent; a custom evaluator is not being embedded into the Miner configuration merely to make the Miner register. citeturn1search1turn1search7

## Next implementation gate

Before producing `miner.yaml`:

1. Expose the Verity API through a stable production endpoint.
2. Map the supported request shape to the internal Intent handlers.
3. Add API-level contract tests.
4. Deploy the service to Render and obtain the real HTTPS base URL.
5. Verify the live canonical Intent set.
6. Verify Miner-ID availability.
7. Create and validate the final Miner YAML.
8. Only then perform registration.

This order prevents a syntactically valid YAML file from pointing at an unready service or using an unverified on-chain identity.
