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

The local `intent` value must be one of the 30 entries in `src/intents/catalogue.ts`. The registration manifests intentionally advertise only the original 29 until each new capability passes the manifest and Integrate gates; the local catalogue is not a statement of live miner registration.

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

The Telegraph Miner YAML describes the shared POST endpoint and generic request/response envelope. Intent-specific request details are defined by each local handler. The YAML will not invent separate HTTP endpoints for each Intent unless verified Integrate requirements demonstrate that this is necessary.
