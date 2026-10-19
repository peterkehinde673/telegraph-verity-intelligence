import test from "node:test";
import assert from "node:assert/strict";
import { newsSearch } from "../dist/intents/news-search.js";

test("news search returns source-backed results and evidence", async () => {
  const result = await newsSearch("AI regulation", {
    searchImpl: async () => [{
      title: "Example news report",
      url: "https://example.com/news",
      source_id: "news:example",
      source_type: "news-rss",
      excerpt: "A source-backed summary.",
      published_at: "2026-10-10T12:00:00.000Z"
    }],
    now: () => "2026-10-10T13:00:00.000Z"
  });

  assert.equal(result.intent, "NEWS_SEARCH");
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.results.length, 1);
  assert.equal(result.answer.results[0]?.source_id, "news:example");
  assert.equal(result.evidence[0]?.source_id, "news:example");
});

test("news search rejects empty queries without calling provider", async () => {
  let called = false;
  const result = await newsSearch("  ", {
    searchImpl: async () => { called = true; return []; }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("news search abstains when provider returns no valid results", async () => {
  const result = await newsSearch("some topic", {
    searchImpl: async () => [
      { title: "", url: "https://example.com", source_id: "bad-title" },
      { title: "No valid URL", url: "javascript:alert(1)", source_id: "bad-url" }
    ]
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.answer.results.length, 0);
});

test("news search bounds the result limit", async () => {
  const result = await newsSearch("topic", {
    max_results: 1,
    searchImpl: async () => [
      { title: "One", url: "https://example.com/1", source_id: "1" },
      { title: "Two", url: "https://example.com/2", source_id: "2" }
    ]
  });

  assert.equal(result.answer.results.length, 1);
});

test("news search sanitizes provider failures", async () => {
  const result = await newsSearch("topic", {
    searchImpl: async () => { throw new Error("private token super-secret"); }
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "news_search_failed");
  assert.equal(result.uncertainty[0]?.message.includes("super-secret"), false);
});
