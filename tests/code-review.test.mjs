import test from "node:test";
import assert from "node:assert/strict";
import { reviewCode } from "../dist/intents/code-review.js";

test("CODE_REVIEW identifies hard-coded secrets and dynamic execution", async () => {
  const result = await reviewCode(
    'const api_key = "example-super-secret-value";\neval(userInput);',
    { now: () => "2026-10-12T00:00:00.000Z" }
  );

  assert.equal(result.intent, "CODE_REVIEW");
  assert.equal(result.answer.scope, "static-heuristics");
  assert.ok(result.answer.findings.some((finding) => finding.rule_id === "possible-hardcoded-secret"));
  assert.ok(result.answer.findings.some((finding) => finding.rule_id === "dynamic-code-execution"));
  assert.ok(result.evidence.length >= 2);
  assert.ok(result.uncertainty.some((item) => item.code === "static_review_only"));
});

test("CODE_REVIEW rejects empty input without claiming a clean review", async () => {
  const result = await reviewCode("  ", { now: () => "2026-10-12T00:00:00.000Z" });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.confidence, 1);
  assert.equal(result.answer.lines_reviewed, 0);
  assert.equal(result.evidence.length, 0);
});

test("CODE_REVIEW reports debug output and unfinished-work markers", async () => {
  const result = await reviewCode(
    'console.log("debug"); // TODO remove before release',
    { now: () => "2026-10-12T00:00:00.000Z" }
  );

  const rules = result.answer.findings.map((finding) => finding.rule_id);
  assert.ok(rules.includes("debug-output"));
  assert.ok(rules.includes("unfinished-work"));
});
