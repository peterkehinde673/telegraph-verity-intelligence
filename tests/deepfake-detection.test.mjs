import test from "node:test";
import assert from "node:assert/strict";
import { detectDeepfake } from "../dist/intents/deepfake-detection.js";

test("deepfake detection reports likely manipulation with normalized probability", async () => {
  const result = await detectDeepfake("media://sample", {
    detectImpl: async () => ({
      media_type: "video",
      signal: "manipulated_likely",
      manipulation_probability: 0.94,
      indicators: ["Detector found temporal inconsistencies."],
      source_id: "detector:example"
    }),
    now: () => "2026-10-05T16:00:00.000Z"
  });

  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.media_type, "video");
  assert.equal(result.answer.manipulation_probability, 0.94);
  assert.equal(result.evidence[0]?.source_id, "detector:example:0");
});

test("deepfake detection reports authentic-likely without claiming proof", async () => {
  const result = await detectDeepfake("media://sample", {
    detectImpl: async () => ({
      media_type: "image",
      signal: "authentic_likely",
      manipulation_probability: 0.06,
      indicators: ["No strong manipulation indicators were detected."]
    })
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.signal, "authentic_likely");
  assert.equal(result.uncertainty[0]?.code, "deepfake_detection_is_probabilistic");
});

test("deepfake detection abstains when detector is indeterminate", async () => {
  const result = await detectDeepfake("media://sample", {
    detectImpl: async () => ({
      media_type: "audio",
      signal: "indeterminate",
      manipulation_probability: null,
      indicators: ["Insufficient signal."]
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("deepfake detection clamps probabilities", async () => {
  const result = await detectDeepfake("media://sample", {
    detectImpl: async () => ({
      media_type: "video",
      signal: "manipulated_likely",
      manipulation_probability: 4,
      indicators: []
    })
  });

  assert.equal(result.answer.manipulation_probability, 1);
  assert.equal(result.confidence, 1);
});

test("deepfake detection rejects empty input before detector access", async () => {
  let called = false;
  const result = await detectDeepfake(" ", {
    detectImpl: async () => {
      called = true;
      return { media_type: "unknown", signal: "indeterminate", manipulation_probability: null, indicators: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});
