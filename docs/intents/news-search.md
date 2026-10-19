# NEWS_SEARCH

The live Telegraph intent registry lists `NEWS_SEARCH` as canonical and describes requests to find news articles or coverage for a topic, entity, or time period. The registry description says to use `NEWS_HEADLINES` when the caller wants a headline list. See the [Telegraph intent registry documentation](https://docs.telegraphprotocol.com/docs/using/intents) and the [live registry endpoint](https://devnode.telegraphprotocol.com/engine/v1/intents).

## Telegraph contract investigation

Checked on 2026-10-20:

- The live registry entry exposes `intent_id`, `intent_name`, `canonical`, `description`, and `miner_count`. It confirms the intent's meaning and current canonical status, but provides no per-intent input or output schema.
- Telegraph's [Intent documentation](https://docs.telegraphprotocol.com/docs/using/intents) explains the shared intent taxonomy and gives a query-only request example for the Engine's auto-routing API. That API example is not a miner endpoint contract.
- The official [YAML configuration guide](https://docs.telegraphprotocol.com/docs/miners/yaml-config) describes endpoint `params`, `intents`, and descriptions as the request-building metadata. Its generic top-level `input_schema` is surfaced to callers and is not enforced as a per-endpoint validator. Neither mechanism defines a `NEWS_SEARCH` payload.
- The official [validation API documentation](https://docs.telegraphprotocol.com/docs/miners/validation-api) defines the validator request (`yaml`, optional conditionally required `api_key`, optional `miner_address`) and validation response. It checks YAML schema, canonical intent names, and endpoint reachability; it explicitly does not prove that Telegraph can build a correct intent-specific request.
- Telegraph's published [miner-dispatcher OpenAPI spec](https://github.com/telegraphprotocol/telegraph-api-docs/blob/main/openapi/miner-dispatcher.yaml) describes generic proxy JSON objects, not an authoritative `NEWS_SEARCH` request or result schema.

Therefore the local `{ intent, input: { query } }` request and Verity response envelope below are project contracts, not confirmed Telegraph `NEWS_SEARCH` schemas. In the current manifests, `input` is only described as a generic object and does not document a `query` property. There is not enough public authoritative evidence to claim exact protocol conformance or advertise this intent in either manifest. Ask Telegraph to publish or confirm the per-intent request/response contract before integration.

## Scope

This handler searches the Google News RSS search endpoint and returns article records with their source URLs, titles, source identifiers, excerpts when available, and publication times when available. It is distinct from `NEWS_HEADLINES`, which returns headline records. Returned articles are evidence of coverage, not proof that their claims are true.

## Local request and response

The local handler accepts a non-empty `query` string. It returns that query, a bounded list of result records, provenance evidence, and retrieval time in the shared Verity response envelope. The Telegraph registry defines the intent's meaning but does not publish a fixed `NEWS_SEARCH` JSON request/response schema. For that reason, this intent is implemented locally but is not advertised in `miner.yaml` or `miner.yaml.template` pending confirmation of the integration contract.

## Result states and limits

- Non-empty results with valid HTTP(S) URLs, titles, and source IDs -> `confirmed`
- No valid results or provider failure -> `insufficient_evidence`
- Empty query -> `rejected`
- Provider requests use a 10-second timeout; raw provider errors are not returned
- Results are capped at 10 by the current Google News RSS adapter and at 50 by the handler
