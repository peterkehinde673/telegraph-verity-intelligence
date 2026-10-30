# WEB_SEARCH

The live Telegraph registry confirms `WEB_SEARCH` as canonical and currently lists 25 miners (checked 2026-10-19). Its current description is for current, live, or externally sourced information that static knowledge cannot reliably provide. This is a general web search capability. It is distinct from `NEWS_SEARCH` (news article coverage) and `RESEARCH_QUERY` (the existing local Wikipedia-backed lookup).

Telegraph's [Intent documentation](https://docs.telegraphprotocol.com/docs/using/intents) defines the name and purpose but does not publish a fixed per-intent request or response schema. The request and response below are Verity contracts, not Telegraph-guaranteed schemas.

## Verity request

The local handler expects a non-empty query string with at most 500 characters:

```json
{
  "intent": "WEB_SEARCH",
  "input": {
    "query": "current information to find on the web"
  }
}
```

It is dispatched through `POST /v1/intent`. Empty, malformed, or overlong queries are rejected before provider access.

## Provider and evidence

Verity uses Jina's official Search API (`https://s.jina.ai/`) when `JINA_API_KEY` is configured. Jina's [Reader/Search documentation](https://jina.ai/reader/) identifies `s.jina.ai` as web search and says it returns the top results with their URLs and page content; the [official OpenAPI](https://docs.jina.ai/openapi.json) defines a JSON envelope with result records containing fields such as `title`, `description`, `url`, and `publishedTime`. The adapter requests JSON and `no-content` results to avoid downloading full result-page content when it is unnecessary.

The API key is read from the runtime environment and is never stored in source or manifests. Jina documents that Search requires an API key, has rate limits, and charges token usage (its current pricing page describes fixed search usage starting at 10,000 tokens per request and a 10M-token free allowance for new keys). No live Jina request was made during implementation or tests; tests use controlled responses to avoid credential use and billable calls. Confirm account limits and configure the key outside the repository before enabling this provider in a deployment.

Each returned record retains its source URL and title, a source ID derived from that URL, the provider's description snippet when available, and a valid publication timestamp when supplied. Evidence records also carry retrieval time and source type. The adapter applies a 10-second timeout, a 512 KiB response cap, a 10-result cap, field-size limits, and HTTP(S)-only URLs without embedded credentials. Provider failures, missing credentials, malformed responses, and empty result sets return `insufficient_evidence`; raw provider errors are not exposed.

For consistency with the existing local search handlers, `confidence` follows the repository's result-count convention (starting at 0.5 and increasing by 0.05 per valid result, capped at 1). It is not calibrated for relevance or claim truth; uncertainty explicitly says results are not verification.

Returned pages are search evidence, not independent verification of their claims. Verity does not summarize or endorse page contents in this intent.

## Manifest status

`WEB_SEARCH` is implemented in the local catalogue and covered by provider, handler, dispatch, and manifest regression tests. It is not added to `miner.yaml` or `miner.yaml.template`. Before advertising it, confirm the deployment has the required Jina credential and that Telegraph Integrate can build the project-defined nested `input.query` request. The documented Integrate validation API is currently returning HTTP 404 HTML; no remote YAML validation has passed.
