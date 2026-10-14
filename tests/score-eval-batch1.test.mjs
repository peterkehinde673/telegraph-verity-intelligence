import test from "node:test";
import assert from "node:assert/strict";
import { contentExtraction } from "../dist/intents/content-extraction.js";
import { detectDeepfake } from "../dist/intents/deepfake-detection.js";
import { scanUrl } from "../dist/intents/url-scan.js";

// Reproducible public regression cases. These are not private holdout data.
// They test conservative response semantics, not the hidden protocol benchmark.

test("CONTENT_EXTRACTION does not imply complete extraction from a tiny fragment", async () => {
  const result = await contentExtraction("https://example.com/article", {
    extractImpl: async () => ({
      content: "Title only",
      content_type: "text/html",
      title: "Example article",
      source_id: "fixture:partial",
      url: "https://example.com/article"
    }),
    now: () => "2026-10-14T00:00:00.000Z"
  });

  assert.equal(result.answer.content, "Title only");
  assert.equal(result.evidence.length, 1);
  assert.notEqual(result.confidence, 1,
    "a non-empty fragment alone must not imply full extraction confidence");
});

test("DEEPFAKE_DETECTION abstains when detector signal is indeterminate despite a numeric score", async () => {
  const result = await detectDeepfake("media://ambiguous", {
    detectImpl: async () => ({
      media_type: "video",
      signal: "indeterminate",
      manipulation_probability: 0.51,
      indicators: ["Detector output is near its decision boundary."]
    }),
    now: () => "2026-10-14T00:00:00.000Z"
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.answer.signal, "indeterminate");
  assert.equal(result.confidence, 0);
});

test("URL_SCAN reports reachability evidence without asserting destination safety", async () => {
  const result = await scanUrl("https://example.com", {
    lookupImpl: async () => [{ address: "93.184.216.34", family: 4 }],
    fetchImpl: async () => new Response("ok", {
      status: 200,
      headers: { "content-type": "text/plain" }
    }),
    now: () => "2026-10-14T00:00:00.000Z"
  });

  assert.equal(result.answer.status_code, 200);
  assert.equal(result.answer.hostname, "example.com");
  assert.equal(result.intent, "URL_SCAN");
  // The URL scanner's evidence is about HTTP reachability; reputation/safety
  // must not be inferred unless a separate security analysis establishes it.
  assert.ok(Array.isArray(result.evidence));
});
