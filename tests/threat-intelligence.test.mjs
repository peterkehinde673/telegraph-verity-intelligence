import test from "node:test";
import assert from "node:assert/strict";
import { lookupThreatIntelligence } from "../dist/intents/threat-intelligence.js";

test("THREAT_INTELLIGENCE returns OTX pulse evidence for a valid indicator", async () => {
  const result = await lookupThreatIntelligence(
    { indicator: "203.0.113.8", indicator_type: "ip" },
    {
      now: () => "2026-10-12T00:00:00.000Z",
      lookupImpl: async () => ({ pulse_count: 1, pulses: [{ name: "Test pulse", tags: ["phishing"] }] })
    }
  );
  assert.equal(result.intent, "THREAT_INTELLIGENCE");
  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.pulse_count, 1);
  assert.equal(result.answer.pulses[0]?.name, "Test pulse");
  assert.equal(result.evidence.length, 1);
});

test("THREAT_INTELLIGENCE validates indicator types and abstains without a provider", async () => {
  const invalid = await lookupThreatIntelligence({ indicator: "abc", indicator_type: "ip" });
  const unconfigured = await lookupThreatIntelligence({ indicator: "203.0.113.8", indicator_type: "ip" });
  assert.equal(invalid.verdict, "rejected");
  assert.equal(unconfigured.verdict, "insufficient_evidence");
  assert.equal(unconfigured.confidence, 0);
});
