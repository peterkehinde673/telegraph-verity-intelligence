import test from "node:test";
import assert from "node:assert/strict";
import { queryThreatIntelligence } from "../dist/intents/threat-intelligence.js";

test("threat intelligence classifies supported indicator types", async () => {
  const inputs = [
    ["203.0.113.10", "ip"],
    ["example.com", "domain"],
    ["https://example.com/path", "url"],
    ["0123456789abcdef0123456789abcdef", "hash"]
  ];

  for (const [indicator, type] of inputs) {
    const result = await queryThreatIntelligence(indicator, {
      lookupImpl: async () => [],
      now: () => "2026-10-05T12:00:00.000Z"
    });
    assert.equal(result.verdict, "not_found");
    assert.equal(result.answer.indicator_type, type);
  }
});

test("threat intelligence rejects unsupported indicators before lookup", async () => {
  let called = false;
  const result = await queryThreatIntelligence("not an indicator", {
    lookupImpl: async () => {
      called = true;
      return [];
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "invalid_indicator");
  assert.equal(called, false);
});

test("threat intelligence confirms a known indicator with evidence", async () => {
  const result = await queryThreatIntelligence("example.com", {
    lookupImpl: async () => [{
      source_id: "feed:example",
      label: "Known phishing domain",
      indicator_type: "domain",
      indicator: "example.com",
      category: "phishing",
      confidence: 0.98,
      first_seen: "2026-01-01"
    }],
    now: () => "2026-10-05T12:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.known_threat, true);
  assert.equal(result.answer.matches[0]?.category, "phishing");
  assert.equal(result.evidence[0]?.source_id, "feed:example");
});

test("threat intelligence abstains without a configured source", async () => {
  const result = await queryThreatIntelligence("203.0.113.10");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});
