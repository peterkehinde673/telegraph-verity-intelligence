# HTTP API

The service exposes three transport endpoints:

- `GET /health` — service health.
- `GET /intents` — the 20-Intent Verity scope.
- `POST /v1/intent` — controlled Intent execution.

## Execution envelope

```json
{
  "intent": "FACT_CHECK",
  "input": {}
}
```

The execution endpoint:

- rejects malformed JSON with HTTP 400;
- rejects missing Intent fields with HTTP 400;
- rejects unsupported Intent names with HTTP 404;
- returns HTTP 501 when an approved Verity Intent has no production handler wired yet;
- returns HTTP 413 when the JSON body exceeds the configured limit;
- does not expose internal exception details.

This endpoint is an internal Verity application interface for now. It is **not yet claimed to be the final Telegraph Miner endpoint contract**; that remains gated on protocol/YAML validation.
