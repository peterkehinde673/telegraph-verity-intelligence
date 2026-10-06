import test from "node:test";
import assert from "node:assert/strict";
import { contentExtraction } from "../dist/intents/content-extraction.js";

test("content extraction returns extracted content with provenance", async () => {
  const result = await contentExtraction("https://example.com/article", {
    extractImpl: async () => ({
      content: "Extracted article content.",
      content_type: "text/html",
      title: "Example Article",
      source_id: "page:1",
      url: "https://example.com/article"
    }),
    now: () => "2026-10-06T04:30:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.content, "Extracted article content.");
  assert.equal(result.answer.title, "Example Article");
  assert.equal(result.evidence[0]?.source_id, "page:1");
});

test("content extraction abstains when the extractor returns no content", async () => {
  const result = await contentExtraction("https://example.com/empty", {
    extractImpl: async () => ({
      content: "   ",
      content_type: "text/html"
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("content extraction rejects empty source before extractor access", async () => {
  let called = false;
  const result = await contentExtraction(" ", {
    extractImpl: async () => {
      called = true;
      return { content: "unexpected", content_type: "text/plain" };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("content extraction abstains without a configured extractor", async () => {
  const result = await contentExtraction("https://example.com/article");
  assert.equal(result.verdict, "insufficient_evidence");
});

test("content extraction converts extractor failures into abstention", async () => {
  const result = await contentExtraction("https://example.com/article", {
    extractImpl: async () => {
      throw new Error("upstream unavailable");
    }
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.uncertainty[0]?.code, "content_extraction_failed");
});
