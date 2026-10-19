# Telegraph Integration Readiness

## Current state

The local TypeScript catalogue contains 34 handler intents. The two miner manifests still advertise the original 29-intent set; `NEWS_SEARCH`, `WEB_SEARCH`, `TWITTER_SEARCH`, `SENTIMENT_ANALYSIS`, and `ONCHAIN_METRIC_VERIFY` remain local while Integrate request-builder behavior and deployment provider configuration are unverified.

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

The live registry at <https://devnode.telegraphprotocol.com/engine/v1/intents> was reachable on 2026-10-19 and returned 134 entries. Recheck it before any manifest or registration change; canonical status and miner counts can change.

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

## Next integration gate

Before adding a new intent to either manifest:

1. Confirm its exact canonical name in the live registry.
2. Document the Verity route, request fields, response envelope, source behavior, and abstention conditions.
3. Confirm the Integrate request builder can construct the documented request and exercise the route.
4. Add it consistently to endpoint intents, the input schema enum, and supported-intent declarations while preserving the original 29.
5. Run local YAML/preflight checks and a successful Integrate validation. The documented API currently returned HTTP 404 HTML in the last recorded check; this is not a passing validation.
6. Have the user review the final YAML, preflight results, and CI before any separately approved dashboard registration.

This order prevents a syntactically valid YAML file from pointing at an unready service or using an unverified on-chain identity.
