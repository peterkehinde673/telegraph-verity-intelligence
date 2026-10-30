# TWITTER_SEARCH

The live Telegraph registry currently confirms `TWITTER_SEARCH` as canonical and lists 10 miners (checked 2026-10-19). Its registry description specifically requires a request to search X/Twitter posts, accounts, or discussion; a question merely about the company does not qualify. This implementation searches public posts and discussion; it does not claim to perform profile/account lookup. It is distinct from general `WEB_SEARCH` and news coverage search.

Telegraph's [intent docs](https://docs.telegraphprotocol.com/docs/using/intents) do not publish a fixed intent-specific request or response schema. The request and result fields below are Verity's local contract.

## Verity request

```json
{
  "intent": "TWITTER_SEARCH",
  "input": {
    "query": "public posts about a topic"
  }
}
```

The query must be a non-empty string of at most 500 characters. Invalid input is rejected before provider access.

## Provider and evidence

When `X_API_BEARER_TOKEN` is present in the server environment, Verity calls X's official [`GET /2/tweets/search/recent`](https://docs.x.com/x-api/posts/search-recent-posts) endpoint. X documents bearer authentication, JSON `data` post records, `meta`, `errors`, and optional expansions, as well as the seven-day recent-search period. The request specifies `max_results=10` (the current documented minimum), selected post fields, and author expansion. It does not paginate.

The provider validates numeric post IDs, bounds text, and generates the canonical X status URL from the post ID and validated author username when available. Each evidence item retains the post ID, provider type, URL, text excerpt, source timestamp when valid, and retrieval timestamp. Verity retains no more than five results from the response.

The official [X pay-per-use pricing page](https://docs.x.com/x-api/getting-started/pricing) currently lists Posts Read at $0.005 per post returned. Because the endpoint requires requesting at least 10 results, one request can return and bill up to 10 posts (up to $0.05 at the listed rate; actual cost depends on returned posts and current rates). A configured token therefore enables paid outbound calls. No credentials were inspected and no live request was made. Set X Developer Console spending controls before providing the runtime secret.

Without a token, with no valid returned posts, or when the provider fails or returns malformed data, the handler abstains with `insufficient_evidence`. Errors and credentials are not included in the response. The ten-second timeout and 512 KiB response limit bound resource use. Search results do not verify the truth of posts' claims.

## Manifest status

This handler is local and tested. `TWITTER_SEARCH` is not in `miner.yaml` or `miner.yaml.template`; both still advertise the original 29 intents. Telegraph does not publish its per-intent schema, and Integrate's ability to construct `input.query` plus remote YAML validation must be confirmed before manifest integration. See the [Integrate endpoint guide](../integrate-endpoint-guide.md).
