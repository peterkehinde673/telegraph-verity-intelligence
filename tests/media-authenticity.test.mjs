import test from "node:test";
import assert from "node:assert/strict";
import { checkMediaAuthenticity } from "../dist/intents/media-authenticity.js";

test("media authenticity reports consistent provenance with evidence", async () => {
  const result = await checkMediaAuthenticity("media://sample", {
    verifyImpl: async () => ({
      media_type: "image",
      signal: "provenance_consistent",
      indicators: ["Embedded provenance matches the supplied media reference."],
      source_id: "provenance:example"
    }),
    now: () => "2026-10-05T17:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.media_type, "image");
  assert.equal(result.answer.signal, "provenance_consistent");
  assert.equal(result.evidence[0]?.source_id, "provenance:example:0");
});

test("media authenticity distinguishes inconsistent provenance", async () => {
  const result = await checkMediaAuthenticity("media://sample", {
    verifyImpl: async () => ({
      media_type: "video",
      signal: "provenance_inconsistent",
      indicators: ["Integrity metadata conflicts with the supplied media."],
    })
  });

  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.signal, "provenance_inconsistent");
});

test("media authenticity abstains when verification is indeterminate", async () => {
  const result = await checkMediaAuthenticity("media://sample", {
    verifyImpl: async () => ({
      media_type: "audio",
      signal: "indeterminate",
      indicators: ["No reliable provenance metadata is available."]
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("media authenticity rejects empty input before verifier access", async () => {
  let called = false;
  const result = await checkMediaAuthenticity(" ", {
    verifyImpl: async () => {
      called = true;
      return { media_type: "unknown", signal: "indeterminate", indicators: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("media authenticity abstains without a configured source", async () => {
  const result = await checkMediaAuthenticity("media://sample");
  assert.equal(result.verdict, "insufficient_evidence");
});
