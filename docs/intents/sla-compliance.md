# SLA_COMPLIANCE

## Local scope

This Verity implementation calculates uptime against a stated percentage target using totals supplied by the caller. It requires the supplied measured duration to cover the exact UTC period and accepts integer downtime within that duration. It does not collect monitoring data or assess response-time, incident-resolution, maintenance-exclusion, service-credit, or contract-interpretation rules.

Telegraph's live registry confirms `SLA_COMPLIANCE` as a canonical intent and describes checking measured response time, resolution time, or uptime against a stated service level. Telegraph does not publish an intent-specific JSON request or response schema. The input and output below are a narrower Verity-defined project contract.

## Request

```json
{
  "intent": "SLA_COMPLIANCE",
  "input": {
    "metric": "uptime",
    "period_start": "2026-01-01T00:00:00Z",
    "period_end": "2026-01-02T00:00:00Z",
    "measured_seconds": 86400,
    "downtime_seconds": 60,
    "target_uptime_percent": 99.9
  }
}
```

The period must be a positive UTC ISO 8601 interval no longer than 366 days. `measured_seconds` must equal the period's exact duration; downtime must be an integer from zero through that duration; target must be a finite percentage from 0 through 100 with at most two decimal places. Unsupported metric names are rejected.

## Response and evidence limits

Verity computes `(measured_seconds - downtime_seconds) / measured_seconds * 100`, compares it to the target without rounding, and returns the displayed percentage rounded to six decimal places plus `meets_target`. Its evidence record quotes the supplied period and totals as `user-provided-measurement`. A `confirmed` result confirms only the arithmetic on those inputs; the response also states that the measurements, monitoring coverage, exclusions, and contract interpretation were not independently verified.

No external monitoring provider or monitoring credential is used. A caller can submit incomplete or inaccurate totals, so this is not independent proof of service performance. It does not decide whether an SLA was legally or contractually met when the agreement defines exclusions or a different measurement method. Tests use constructed data only; no customer or production monitoring records were accessed.

## Integrate endpoint mapping

The real Verity server routes this intent through `POST /v1/intent` with `application/json`, no multipart fields, no parameter mapping, and no inbound authentication. The top-level body fields are `intent: string` and `input: object`; the nested properties shown above are Verity's local contract. Integrate's ability to construct those nested properties and successful saved-YAML validation remain unverified. Keep this intent out of both manifests until those gates pass.
