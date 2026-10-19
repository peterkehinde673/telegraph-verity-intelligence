# Proposed Telegraph Integrate endpoint configuration

This guide describes the endpoint implemented by the Verity server and the fields that would be relevant in Telegraph Integrate. It is preparation for a later manual review, not registration-ready YAML. No miner manifest was changed in this batch.

## NEWS_SEARCH endpoint proposal

| Integrate field | Project-supported value | Evidence / status |
| --- | --- | --- |
| Intent association | `NEWS_SEARCH` | Exact canonical name confirmed in the live registry; currently 18 miners. Keep it out of the saved manifest until the Integrate request builder and validation checks have been reviewed. |
| Telegraph path | `/v1/intent` | The server accepts this incoming path. |
| API endpoint path | `/v1/intent` | The server routes `POST /v1/intent` to the intent dispatcher. |
| HTTP method | `POST` | Implemented by `src/server.ts`. |
| Endpoint base URL override | Blank | Use the manifest's top-level `base_url`; the current manifest points at the Render service. Do not change this production setting as part of this guide. |
| Content type | `application/json` | The server reads a JSON request body and emits `application/json; charset=utf-8`. |
| Multipart fields | None | The endpoint does not accept multipart data. |
| Parameter mapping | None | The request body keys are passed through as `intent` and `input`; Telegraph's documented `param_map` is for renaming incoming query parameters. |
| Authentication | None | The server exposes no authentication middleware and the existing manifest declares `auth.type: none`. |

### Verity request shape

The project-defined JSON request for this route is:

```json
{
  "intent": "NEWS_SEARCH",
  "input": {
    "query": "non-empty news topic, entity, or search phrase"
  }
}
```

The shared endpoint requires a string `intent`. For `NEWS_SEARCH`, Verity's handler expects `input.query` to be a non-empty string. The shared HTTP layer leaves `input` opaque; a missing, non-string, or whitespace-only query reaches the handler as empty input and is rejected without contacting the provider.

Telegraph's YAML documentation represents endpoint `params` as typed top-level fields grouped by location, and permits `object` as a parameter type. Therefore the closest documented parameter declaration for this route is two required body parameters, `intent: string` and `input: object`, with the `input` description explaining the NEWS_SEARCH `query` property. The docs do not specify nested per-property validation inside that object. The request builder must be confirmed to produce the nested `input.query` shape above; a flattened top-level `query` would not match this server route.

If Integrate requires a more explicit nested JSON schema or parameter mapping than the documented `params` fields support, obtain Telegraph's instructions before changing the handler or manifest. Do not add `NEWS_SEARCH` to `endpoints[].intents`, `input_schema.intent.enum`, or `semantics.supported_intents` until this is resolved in dashboard validation.

### Project response shape

The route returns Verity's shared response envelope. A valid query with no valid provider records can produce this abstention response:

```json
{
  "intent": "NEWS_SEARCH",
  "verdict": "insufficient_evidence",
  "confidence": 0,
  "answer": {
    "query": "example topic",
    "results": []
  },
  "evidence": [],
  "uncertainty": [
    {
      "code": "no_news_results",
      "message": "The configured news source returned no valid results for this query."
    }
  ],
  "retrieved_at": "<server-generated ISO 8601 timestamp>"
}
```

When the provider returns valid articles, each result carries `title`, `url`, `excerpt` (nullable), `source_id`, and `published_at` (nullable). Evidence records preserve source ID/type, title, URL, publication time when supplied, and retrieval time. These are Verity's implementation fields, not a Telegraph-published NEWS_SEARCH response schema. Article coverage is not proof that an article's claims are true.

## Telegraph protocol boundary

Telegraph's [live registry](https://devnode.telegraphprotocol.com/engine/v1/intents) confirms the canonical name and intent description. Its [intent documentation](https://docs.telegraphprotocol.com/docs/using/intents) says the registry exposes canonical names, descriptions, and current miner counts. The [YAML guide](https://docs.telegraphprotocol.com/docs/miners/yaml-config) documents generic request-building metadata, and the [validation API](https://docs.telegraphprotocol.com/docs/miners/validation-api) checks YAML plus endpoint reachability. None of these publishes a NEWS_SEARCH-specific request or response schema, and the validator docs caution that validation does not verify that a correct intent-specific request can be built.

The local handler contract and route have now been exercised together in a route-level integration test. The Integrate validator remains unavailable: its documented API returned HTTP 404 HTML in the prior investigation. The eventual dashboard check must confirm that the builder sends the nested body as expected and accepts the Verity response envelope before any manifest integration. Do not register the miner during that check.
