import test from "node:test";
import assert from "node:assert/strict";
import { researchQuery } from "../dist/intents/research-query.js";

test("research query returns normalized search results and evidence", async () => {
  const result = await researchQuery("quantum networking", {
    searchImpl: async () => [{
      title: "Primary result",
      url: "https://example.com/research",
      excerpt: "Relevant research excerpt.",
      source_id: "research:1",
      source_type: "paper",
      published_at: "2026-01-01T00:00:00.000Z"
    }],
    now: () => "2026-10-05T21:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.results.length, 1);
  assert.equal(result.evidence[0]?.source_id, "research:1");
});

test("research query applies the configured result limit", async () => {
  const result = await researchQuery("sample", {
    max_results: 1,
    searchImpl: async () => [
      { title: "One", url: "https://example.com/1", source_id: "1" },
      { title: "Two", url: "https://example.com/2", source_id: "2" }
    ]
  });

  assert.equal(result.answer.results.length, 1);
});

test("research query abstains when there are no results", async () => {
  const result = await researchQuery("unknown", {
    searchImpl: async () => []
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("research query rejects empty input before search access", async () => {
  let called = false;
  const result = await researchQuery(" ", {
    searchImpl: async () => {
      called = true;
      return [];
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("research query abstains without a configured search source", async () => {
  const result = await researchQuery("sample query");
  assert.equal(result.verdict, "insufficient_evidence");
});
