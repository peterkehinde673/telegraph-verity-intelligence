# ONCHAIN_METRIC_VERIFY

## Scope

The local implementation supports one narrow metric: `transaction_gas_used` for an Ethereum mainnet transaction at an explicit decimal block number. It does not implement generic on-chain metrics, wallet balances, event-log decoding, or a moving `latest` block query. The request's hash and block number are validated before provider access.

This is a Verity-defined request contract. Telegraph's live registry confirms the canonical intent name and describes block-height-specific on-chain metric queries, but does not publish an intent-specific JSON schema or response schema.

## Project request

```json
{
  "intent": "ONCHAIN_METRIC_VERIFY",
  "input": {
    "metric": "transaction_gas_used",
    "transaction_hash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "block_number": "21000000",
    "expected_gas_used": "21000"
  }
}
```

`expected_gas_used` is optional. When provided, the response reports whether the returned node value matches it; a mismatch is explicit and does not change the retrieved value. The implementation refuses other networks and metric names.

## Data source, evidence, and limitations

Set the server-side `ETHEREUM_RPC_URL` to an operator-managed HTTPS Ethereum JSON-RPC endpoint. It is never supplied by the caller. The provider makes read-only `eth_chainId` and `eth_getTransactionReceipt` calls, requires chain ID `0x1`, checks the returned transaction and block, bounds response size and time, rejects redirects, and sanitizes provider failures. No provider is contacted when the environment variable is absent or input is invalid.

The response includes `answer.gas_used`, the transaction and block identifiers, and an evidence record identifying the JSON-RPC source and configured host. A single RPC node is the evidence source; no independent node or light-client verification is performed. A node's chain ID alone does not prove canonicality or finality. Missing receipts, mismatched blocks, unavailable history, and malformed responses abstain. No live RPC request or credential was used in implementation tests.

The receipt fields and JSON-RPC quantity format follow the [Ethereum Execution API receipt reference](https://ethereum.github.io/execution-apis/api/methods/eth_getTransactionReceipt/) and [Ethereum JSON-RPC documentation](https://ethereum.org/developers/docs/apis/json-rpc/). These define the underlying RPC method, not Telegraph's intent-level schema.

## Project response example

Representative response from the local Verity envelope (values illustrative):

```json
{
  "intent": "ONCHAIN_METRIC_VERIFY",
  "verdict": "confirmed",
  "confidence": 1,
  "answer": {
    "network": "ethereum-mainnet",
    "metric": "transaction_gas_used",
    "transaction_hash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "block_number": "21000000",
    "gas_used": "21000",
    "expected_gas_used": "21000",
    "matches_expected": true
  },
  "evidence": [
    {
      "source_id": "ethereum-mainnet:receipt:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "source_type": "ethereum-json-rpc",
      "title": "Ethereum transaction receipt at block 21000000",
      "excerpt": "Transaction ... was included in block ...; gasUsed=21000. RPC node: rpc.example.test.",
      "retrieved_at": "2026-10-19T00:00:00.000Z"
    }
  ],
  "uncertainty": [
    {
      "code": "configured_rpc_is_the_data_source",
      "message": "This result reflects the configured Ethereum RPC node; the receipt is not independently cross-checked against another node or a light client."
    }
  ],
  "retrieved_at": "2026-10-19T00:00:00.000Z"
}
```

## Integrate endpoint mapping

The Verity server handles this through its shared `POST /v1/intent` route with `application/json`, no multipart fields, and no inbound authentication. The proposed intent association is `ONCHAIN_METRIC_VERIFY`; base URL override remains blank and the current manifest base URL remains in force. The request body is passed as JSON without parameter mapping. A dashboard declaration would need top-level `intent: string` and `input: object`; whether Integrate can construct the nested fields under `input` must be verified in the dashboard. Telegraph has not guaranteed this schema or accepted this endpoint mapping.

Keep the intent out of `miner.yaml` and `miner.yaml.template` until the Integrate builder, saved-config validation, endpoint behavior, and all manifest consistency gates have been checked. The official validator's known 404 HTML response is not validation success.
