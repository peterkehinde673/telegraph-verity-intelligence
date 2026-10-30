import test from "node:test";
import assert from "node:assert/strict";
import { checkTextAuthenticity } from "../dist/intents/text-authenticity.js";

test("text authenticity returns a confirmed signal with evidence", async () => {
  const result = await checkTextAuthenticity("original sample", {
    analyzeImpl: async () => ({
      signal: "consistent",
      indicators: ["Source metadata matches the supplied text."],
      source_id: "auth:example"
    }),
    now: () => "2026-10-05T14:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.signal, "consistent");
  assert.equal(result.evidence[0]?.source_id, "auth:example:0");
});

test("text authenticity distinguishes an inconsistent signal", async () => {
  const result = await checkTextAuthenticity("sample", {
    analyzeImpl: async () => ({
      signal: "inconsistent",
      indicators: ["Known provenance conflicts with the supplied text."]
    })
  });

  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.signal, "inconsistent");
});

test("text authenticity abstains when the source cannot decide", async () => {
  const result = await checkTextAuthenticity("sample", {
    analyzeImpl: async () => ({
      signal: "unknown",
      indicators: ["Insufficient provenance."]
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("text authenticity rejects empty content before analysis", async () => {
  let called = false;
  const result = await checkTextAuthenticity(" ", {
    analyzeImpl: async () => {
      called = true;
      return { signal: "consistent", indicators: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("text authenticity abstains without a configured source", async () => {
  const result = await checkTextAuthenticity("sample");
  assert.equal(result.verdict, "insufficient_evidence");
});
