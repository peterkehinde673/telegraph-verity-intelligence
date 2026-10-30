import test from "node:test";
import assert from "node:assert/strict";
import { verifyImage } from "../dist/intents/image-verification.js";

test("image verification confirms a verified result with evidence", async () => {
  const result = await verifyImage("image://sample", {
    verifyImpl: async () => ({
      signal: "verified",
      indicators: ["The supplied image matches the verification reference."],
      source_id: "image-check:example"
    }),
    now: () => "2026-10-05T18:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.signal, "verified");
  assert.equal(result.evidence[0]?.source_id, "image-check:example:0");
});

test("image verification reports a mismatch without overstating certainty", async () => {
  const result = await verifyImage("image://sample", {
    verifyImpl: async () => ({
      signal: "mismatch",
      indicators: ["The supplied image does not match the verification reference."]
    })
  });

  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.signal, "mismatch");
});

test("image verification abstains when verification is indeterminate", async () => {
  const result = await verifyImage("image://sample", {
    verifyImpl: async () => ({
      signal: "indeterminate",
      indicators: ["No reliable reference is available."]
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("image verification rejects empty input before verifier access", async () => {
  let called = false;
  const result = await verifyImage(" ", {
    verifyImpl: async () => {
      called = true;
      return { signal: "indeterminate", indicators: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("image verification abstains without a configured verifier", async () => {
  const result = await verifyImage("image://sample");
  assert.equal(result.verdict, "insufficient_evidence");
});
