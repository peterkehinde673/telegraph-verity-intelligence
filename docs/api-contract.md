# Verity API contract

The public miner endpoint is:

`POST /v1/intent`

Request:

```json
{
  "intent": "CVE_LOOKUP",
  "input": {
    "cve_id": "CVE-2026-0001"
  }
}
```

The `intent` value must be one of the 20 entries in `src/intents/catalogue.ts`.

The `input` object is Intent-specific. Verity intentionally keeps it opaque at the shared HTTP layer; the Intent handler validates its own required fields.

Every successful Intent response uses:

- `intent`
- `verdict`
- `confidence` (0 to 1)
- `answer`
- `evidence`
- `uncertainty`
- `retrieved_at`

Health:

`GET /health`

Intent catalogue:

`GET /intents`

The Telegraph Miner YAML will describe this shared POST endpoint and its request/response schema. The YAML will not invent separate HTTP endpoints for each Intent unless the live validation requirements demonstrate that this is necessary.
