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
