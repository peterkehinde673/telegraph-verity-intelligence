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


test("THREAT_INTELLIGENCE does not expose raw provider errors", async () => {
  const result = await lookupThreatIntelligence(
    { indicator: "203.0.113.8", indicator_type: "ip" },
    {
      now: () => "2026-10-17T00:00:00.000Z",
      lookupImpl: async () => {
        throw new Error("private OTX endpoint https://otx.invalid/?token=secret-threat-77");
      }
    }
  );

  assert.equal(result.intent, "THREAT_INTELLIGENCE");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "threat_feed_lookup_failed");
  assert.equal(
    result.uncertainty[0]?.message,
    "The configured threat-intelligence source could not be reached or returned an invalid response."
  );
  assert.equal(result.uncertainty[0]?.message.includes("secret-threat-77"), false);
  assert.deepEqual(result.evidence, []);
});


test("THREAT_INTELLIGENCE abstains when provider returns malformed pulse data", async () => {
  const result = await lookupThreatIntelligence(
    { indicator: "203.0.113.8", indicator_type: "ip" },
    {
      now: () => "2026-10-17T00:00:00.000Z",
      lookupImpl: async () => ({ pulse_count: "many", pulses: "not-an-array" })
    }
  );

  assert.equal(result.intent, "THREAT_INTELLIGENCE");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "invalid_threat_feed_response");
  assert.deepEqual(result.evidence, []);
  assert.deepEqual(result.answer.pulses, []);
});
