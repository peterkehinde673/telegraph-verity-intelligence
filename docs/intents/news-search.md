# NEWS_SEARCH

The live Telegraph intent registry lists `NEWS_SEARCH` as canonical and describes requests to find news articles or coverage for a topic, entity, or time period. The registry description says to use `NEWS_HEADLINES` when the caller wants a headline list. See the [Telegraph intent registry documentation](https://docs.telegraphprotocol.com/docs/using/intents) and the [live registry endpoint](https://devnode.telegraphprotocol.com/engine/v1/intents).

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
