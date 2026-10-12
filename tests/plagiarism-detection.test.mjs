import test from "node:test";
import assert from "node:assert/strict";
import { detectPlagiarism } from "../dist/intents/plagiarism-detection.js";

const copiedText = "The quick brown fox jumps over the lazy dog while researchers examine the unusual pattern in the original document and compare the results carefully.";

test("PLAGIARISM_DETECTION flags substantial overlap with a supplied source", async () => {
  const result = await detectPlagiarism({
    text: copiedText,
    comparison_documents: [{
      title: "Reference source",
      url: "https://example.org/reference",
      text: copiedText + " Additional unrelated material follows here."
    }]
  }, { now: () => "2026-10-12T00:00:00.000Z" });

  assert.equal(result.intent, "PLAGIARISM_DETECTION");
  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.documents_checked, 1);
  assert.ok(result.answer.highest_similarity >= 0.6);
  assert.equal(result.evidence.length, 1);
});

test("PLAGIARISM_DETECTION abstains when no comparison corpus is supplied", async () => {
  const result = await detectPlagiarism({ text: copiedText });
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.evidence.length, 0);
});

test("PLAGIARISM_DETECTION rejects short text and does not cite invalid URLs", async () => {
  const short = await detectPlagiarism({ text: "too short" });
  const result = await detectPlagiarism({
    text: copiedText,
    comparison_documents: [{ title: "No URL", url: "javascript:alert(1)", text: copiedText }]
  });
  assert.equal(short.verdict, "rejected");
  assert.equal(result.verdict, "likely");
  assert.equal(result.evidence.length, 0);
  assert.equal(result.answer.matches[0]?.url, undefined);
});
