import test from "node:test";
import assert from "node:assert/strict";
import { slaCompliance } from "../dist/intents/sla-compliance.js";

const periodStart = "2026-01-01T00:00:00Z";
const periodEnd = "2026-01-02T00:00:00Z";
const input = {
  metric: "uptime",
  period_start: periodStart,
  period_end: periodEnd,
  measured_seconds: 86400,
  downtime_seconds: 60,
  target_uptime_percent: 99.9
};

test("SLA_COMPLIANCE calculates uptime from full-period caller-supplied totals", () => {
  const result = slaCompliance(input, () => "2026-01-03T00:00:00.000Z");
  assert.equal(result.intent, "SLA_COMPLIANCE");
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.observed_uptime_percent, 99.930556);
  assert.equal(result.answer.meets_target, true);
  assert.equal(result.evidence[0].source_type, "user-provided-measurement");
  assert.match(result.evidence[0].excerpt, /60 seconds of downtime across 86400 measured seconds/);
  assert.ok(result.uncertainty.some(item => item.code === "measurements_not_independently_verified"));
});

test("SLA_COMPLIANCE identifies when the supplied totals miss the threshold", () => {
  const result = slaCompliance({ ...input, downtime_seconds: 120 });
  assert.equal(result.answer.observed_uptime_percent, 99.861111);
  assert.equal(result.answer.meets_target, false);
  assert.equal(result.verdict, "confirmed", "only the calculation from the supplied totals is confirmed");
});

test("SLA_COMPLIANCE rejects unsupported metrics, malformed periods, and incomplete measurements", () => {
  for (const [badInput, code] of [
    [{ ...input, metric: "resolution_time" }, "unsupported_sla_metric"],
    [{ ...input, period_start: "2026-02-30T00:00:00Z" }, "invalid_sla_period"],
    [{ ...input, period_end: periodStart }, "invalid_sla_period"],
    [{ ...input, measured_seconds: 86399 }, "invalid_sla_measurements"],
    [{ ...input, downtime_seconds: 86401 }, "invalid_sla_measurements"],
    [{ ...input, target_uptime_percent: 99.999 }, "invalid_sla_measurements"],
    [{ ...input, target_uptime_percent: 101 }, "invalid_sla_measurements"]
  ]) {
    const result = slaCompliance(badInput);
    assert.equal(result.verdict, "rejected");
    assert.equal(result.uncertainty[0].code, code);
    assert.equal(result.evidence.length, 0);
  }
});

test("SLA_COMPLIANCE rejects null, array, and primitive requests", () => {
  for (const badInput of [null, [], "uptime"]) {
    const result = slaCompliance(badInput);
    assert.equal(result.verdict, "rejected");
    assert.equal(result.intent, "SLA_COMPLIANCE");
  }
});
