import test from "node:test";
import assert from "node:assert/strict";
import { detectAiText } from "../dist/intents/ai-text-detection.js";

test("AI text detection reports a likely AI signal with normalized probability", async () => {
  const result = await detectAiText("generated sample", {
    detectImpl: async () => ({
      signal: "ai_likely",
      ai_probability: 0.93,
      indicators: ["Detector found a strong AI-generation signal."],
      source_id: "detector:example"
    }),
    now: () => "2026-10-05T15:00:00.000Z"
  });

  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.signal, "ai_likely");
  assert.equal(result.answer.ai_probability, 0.93);
  assert.equal(result.evidence[0]?.source_id, "detector:example:0");
});

test("AI text detection reports a human-likely signal without claiming authorship", async () => {
  const result = await detectAiText("human sample", {
    detectImpl: async () => ({
      signal: "human_likely",
      ai_probability: 0.08,
      indicators: ["Detector found a low AI-generation signal."]
    })
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.signal, "human_likely");
  assert.match(result.uncertainty[0]?.code ?? "", /authorship/);
});

test("AI text detection abstains on an indeterminate detector result", async () => {
  const result = await detectAiText("uncertain sample", {
    detectImpl: async () => ({
      signal: "indeterminate",
      ai_probability: null,
      indicators: ["Detector confidence is insufficient."]
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("AI text detection clamps an out-of-range probability", async () => {
  const result = await detectAiText("sample", {
    detectImpl: async () => ({
      signal: "ai_likely",
      ai_probability: 2,
      indicators: []
    })
  });

  assert.equal(result.answer.ai_probability, 1);
  assert.equal(result.confidence, 1);
});

test("AI text detection rejects empty content before calling the detector", async () => {
  let called = false;
  const result = await detectAiText(" ", {
    detectImpl: async () => {
      called = true;
      return { signal: "indeterminate", ai_probability: null, indicators: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});
