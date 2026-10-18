import test from "node:test";
import assert from "node:assert/strict";
import { checkThreatIpReputation } from "../dist/intents/threat-ip-reputation.js";

test("THREAT_IP_REPUTATION returns source-backed risk signals", async () => {
  const result = await checkThreatIpReputation("203.0.113.8", {
    now: () => "2026-10-12T00:00:00.000Z",
    lookupImpl: async () => ({ abuse_confidence_score: 82, total_reports: 19, country_code: "ZZ" })
  });
  assert.equal(result.intent, "THREAT_IP_REPUTATION");
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.abuse_confidence_score, 82);
  assert.equal(result.evidence.length, 1);
});

test("THREAT_IP_REPUTATION rejects invalid addresses and abstains without a provider", async () => {
  const invalid = await checkThreatIpReputation("not-an-ip");
  const unconfigured = await checkThreatIpReputation("203.0.113.8");
  assert.equal(invalid.verdict, "rejected");
  assert.equal(unconfigured.verdict, "insufficient_evidence");
  assert.equal(unconfigured.confidence, 0);
});


test("THREAT_IP_REPUTATION does not expose raw provider errors", async () => {
  const result = await checkThreatIpReputation("203.0.113.8", {
    now: () => "2026-10-18T00:00:00.000Z",
    lookupImpl: async () => {
      throw new Error("private provider URL https://provider.invalid/?token=secret-ip-99");
    }
  });

  assert.equal(result.intent, "THREAT_IP_REPUTATION");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "reputation_lookup_failed");
  assert.equal(result.uncertainty[0]?.message, "The configured IP reputation source could not be reached or returned an invalid response.");
  assert.equal(result.uncertainty[0]?.message.includes("secret-ip-99"), false);
  assert.deepEqual(result.evidence, []);
});
