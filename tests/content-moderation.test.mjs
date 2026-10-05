import test from "node:test";
import assert from "node:assert/strict";
import { moderateContent } from "../dist/intents/content-moderation.js";

test("content moderation flags a classifier finding above threshold", async () => {
  const result = await moderateContent("sample text", {
    classifyImpl: async () => [{
      category: "harassment",
      score: 0.91,
      rationale: "Classifier detected a harassment signal."
    }],
    now: () => "2026-10-05T13:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.flagged, true);
  assert.equal(result.answer.findings[0]?.score, 0.91);
  assert.equal(result.evidence[0]?.source_type, "content-moderation");
});

test("content moderation reports no flagged category when findings remain below threshold", async () => {
  const result = await moderateContent("ordinary text", {
    classifyImpl: async () => [{
      category: "benign",
      score: 0.99,
      rationale: "No policy category was detected."
    }]
  });

  assert.equal(result.verdict, "not_found");
  assert.equal(result.answer.flagged, false);
});

test("content moderation rejects empty content before classification", async () => {
  let called = false;
  const result = await moderateContent("   ", {
    classifyImpl: async () => {
      called = true;
      return [];
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "empty_content");
  assert.equal(called, false);
});

test("content moderation abstains when no classifier is configured", async () => {
  const result = await moderateContent("sample text");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("content moderation clamps classifier scores to the normalized range", async () => {
  const result = await moderateContent("sample text", {
    classifyImpl: async () => [{
      category: "benign",
      score: 4,
      rationale: "Out-of-range test score."
    }]
  });

  assert.equal(result.answer.findings[0]?.score, 1);
  assert.equal(result.confidence, 1);
});
