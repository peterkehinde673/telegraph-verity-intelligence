import test from "node:test";
import assert from "node:assert/strict";
import { newsHeadlines } from "../dist/intents/news-headlines.js";

test("news headlines returns timestamped source-backed headlines", async () => {
  const result = await newsHeadlines("technology", {
    fetchImpl: async () => [{
      title: "Example technology story",
      url: "https://example.com/news",
      source_id: "news:1",
      source_type: "news",
      published_at: "2026-10-05T20:00:00.000Z",
      excerpt: "A source-backed headline."
    }],
    now: () => "2026-10-05T23:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.headlines[0]?.source_id, "news:1");
  assert.equal(result.answer.headlines[0]?.published_at, "2026-10-05T20:00:00.000Z");
  assert.equal(result.evidence[0]?.source_id, "news:1");
});

test("news headlines applies the configured result limit", async () => {
  const result = await newsHeadlines("technology", {
    max_results: 1,
    fetchImpl: async () => [
      { title: "One", url: "https://example.com/1", source_id: "1" },
      { title: "Two", url: "https://example.com/2", source_id: "2" }
    ]
  });

  assert.equal(result.answer.headlines.length, 1);
});

test("news headlines abstains when no headlines are returned", async () => {
  const result = await newsHeadlines("unknown", {
    fetchImpl: async () => []
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("news headlines rejects an empty topic before source access", async () => {
  let called = false;
  const result = await newsHeadlines(" ", {
    fetchImpl: async () => {
      called = true;
      return [];
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("news headlines abstains without a configured source", async () => {
  const result = await newsHeadlines("technology");
  assert.equal(result.verdict, "insufficient_evidence");
});


test("news headlines does not expose raw provider errors", async () => {
  const result = await newsHeadlines("technology", {
    fetchImpl: async () => { throw new Error("secret token abc123 upstream stack trace"); },
    now: () => "2026-10-17T00:00:00.000Z"
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "news_fetch_failed");
  assert.equal(
    result.uncertainty[0]?.message,
    "The configured news source could not be reached or returned an invalid response."
  );
  assert.equal(result.uncertainty[0]?.message.includes("abc123"), false);
  assert.deepEqual(result.evidence, []);
});
