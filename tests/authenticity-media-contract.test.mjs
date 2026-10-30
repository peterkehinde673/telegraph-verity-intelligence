import test from "node:test";
import assert from "node:assert/strict";
import { checkTextAuthenticity } from "../dist/intents/text-authenticity.js";
import { detectAiText } from "../dist/intents/ai-text-detection.js";
import { detectDeepfake } from "../dist/intents/deepfake-detection.js";
import { checkMediaAuthenticity } from "../dist/intents/media-authenticity.js";
import { verifyImage } from "../dist/intents/image-verification.js";
import { verifyVideo } from "../dist/intents/video-verification.js";
import { moderateContent } from "../dist/intents/content-moderation.js";

const now = () => "2026-10-07T00:00:00.000Z";

test("authenticity detectors abstain when no provider is configured", async () => {
  const text = await checkTextAuthenticity("sample", { now });
  const ai = await detectAiText("sample", { now });
  const deepfake = await detectDeepfake("https://example.com/media", { now });
  const media = await checkMediaAuthenticity("https://example.com/media", { now });
  assert.equal(text.verdict, "insufficient_evidence");
  assert.equal(ai.verdict, "insufficient_evidence");
  assert.equal(deepfake.verdict, "insufficient_evidence");
  assert.equal(media.verdict, "insufficient_evidence");
  assert.equal(text.confidence, 0);
  assert.equal(ai.confidence, 0);
  assert.equal(deepfake.confidence, 0);
  assert.equal(media.confidence, 0);
});

test("AI-text probabilities are normalized and detector provenance is preserved", async () => {
  const result = await detectAiText("sample", {
    now,
    detectImpl: async () => ({
      signal: "ai_likely",
      ai_probability: 1.8,
      indicators: ["stylometric signal"],
      source_id: "detector:test"
    })
  });
  assert.equal(result.verdict, "likely");
  assert.equal(result.confidence, 1);
  assert.equal(result.answer.ai_probability, 1);
  assert.equal(result.evidence[0]?.source_id, "detector:test:0");
});

test("deepfake detector normalizes negative probabilities without claiming certainty", async () => {
  const result = await detectDeepfake("media-id", {
    now,
    detectImpl: async () => ({
      media_type: "video",
      signal: "indeterminate",
      manipulation_probability: -0.5,
      indicators: []
    })
  });
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.answer.manipulation_probability, 0);
});

test("media, image and video verification preserve verifier indicators", async () => {
  const media = await checkMediaAuthenticity("media", {
    now,
    verifyImpl: async () => ({ media_type: "image", signal: "provenance_consistent", indicators: ["metadata match"], source_id: "c2pa:test" })
  });
  const image = await verifyImage("image", {
    now,
    verifyImpl: async () => ({ signal: "verified", indicators: ["hash match"], source_id: "hash:test" })
  });
  const video = await verifyVideo("video", {
    now,
    verifyImpl: async () => ({ signal: "mismatch", indicators: ["frame hash mismatch"], source_id: "video:test" })
  });
  assert.equal(media.verdict, "confirmed");
  assert.equal(media.evidence[0]?.source_id, "c2pa:test:0");
  assert.equal(image.verdict, "confirmed");
  assert.equal(image.evidence[0]?.source_id, "hash:test:0");
  assert.equal(video.verdict, "likely");
  assert.equal(video.evidence[0]?.source_id, "video:test:0");
});

test("content moderation clamps scores and applies the documented threshold", async () => {
  const result = await moderateContent("sample", {
    now,
    classifyImpl: async () => [
      { category: "harassment", score: 1.4, rationale: "strong signal" },
      { category: "spam", score: -0.2, rationale: "weak signal" }
    ]
  });
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.flagged, true);
  assert.equal(result.answer.findings[0]?.score, 1);
  assert.equal(result.answer.findings[1]?.score, 0);
  assert.equal(result.confidence, 1);
});

test("content moderation reports no flagged category when all scores are below threshold", async () => {
  const result = await moderateContent("sample", {
    now,
    classifyImpl: async () => [{ category: "spam", score: 0.49, rationale: "weak signal" }]
  });
  assert.equal(result.verdict, "not_found");
  assert.equal(result.answer.flagged, false);
  assert.equal(result.confidence, 0.49);
  assert.equal(result.uncertainty[0]?.code, "no_flagged_category");
});
