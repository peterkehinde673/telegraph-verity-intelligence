# Verity API Dispatch

The Verity API has a thin transport layer between HTTP requests and Intent handlers.

## Request shape

```json
{
  "intent": "FACT_CHECK",
  "input": {}
}
```

The `intent` value must be one of the project's canonical Intent strings. The router rejects unsupported names and does not attempt fuzzy matching.

## Routing behavior

- Supported Intent + registered handler -> handler is invoked.
- Unsupported Intent -> no handler invocation.
- Supported Intent without an implementation -> no handler invocation.

This keeps protocol routing separate from individual Intent implementations.

## HTTP helpers

The API layer also provides bounded JSON-body reading and a no-store JSON response helper. Authentication, rate limiting, and external provider credentials are deliberately outside this logical change and will be added only when required by the deployment design.
