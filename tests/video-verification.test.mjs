import test from "node:test";
import assert from "node:assert/strict";
import { verifyVideo } from "../dist/intents/video-verification.js";

test("video verification confirms a verified result with evidence", async () => {
  const result = await verifyVideo("video://sample", {
    verifyImpl: async () => ({
      signal: "verified",
      indicators: ["The supplied video matches the verification reference."],
      source_id: "video-check:example"
    }),
    now: () => "2026-10-05T19:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.signal, "verified");
  assert.equal(result.evidence[0]?.source_id, "video-check:example:0");
});

test("video verification reports a mismatch without overstating certainty", async () => {
  const result = await verifyVideo("video://sample", {
    verifyImpl: async () => ({
      signal: "mismatch",
      indicators: ["The supplied video does not match the verification reference."]
    })
  });

  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.signal, "mismatch");
});

test("video verification abstains when verification is indeterminate", async () => {
  const result = await verifyVideo("video://sample", {
    verifyImpl: async () => ({
      signal: "indeterminate",
      indicators: ["No reliable reference is available."]
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("video verification rejects empty input before verifier access", async () => {
  let called = false;
  const result = await verifyVideo(" ", {
    verifyImpl: async () => {
      called = true;
      return { signal: "indeterminate", indicators: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("video verification abstains without a configured verifier", async () => {
  const result = await verifyVideo("video://sample");
  assert.equal(result.verdict, "insufficient_evidence");
});
