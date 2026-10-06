import test from "node:test";
import assert from "node:assert/strict";
import { academicSearch } from "../dist/intents/academic-search.js";

test("academic search returns normalized scholarly results", async () => {
  const result = await academicSearch("quantum error correction", {
    searchImpl: async () => [{
      title: "Example academic paper",
      url: "https://example.org/paper",
      source_id: "paper:1",
      authors: ["Author One", "Author Two"],
      published_at: "2026-01-15T00:00:00.000Z",
      abstract: "A scholarly abstract."
    }],
    now: () => "2026-10-06T04:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.results[0]?.source_id, "paper:1");
  assert.deepEqual(result.answer.results[0]?.authors, ["Author One", "Author Two"]);
  assert.equal(result.evidence[0]?.excerpt, "A scholarly abstract.");
});

test("academic search applies the configured result limit", async () => {
  const result = await academicSearch("sample", {
    max_results: 1,
    searchImpl: async () => [
      { title: "One", url: "https://example.org/1", source_id: "1" },
      { title: "Two", url: "https://example.org/2", source_id: "2" }
    ]
  });

  assert.equal(result.answer.results.length, 1);
});

test("academic search abstains when no results are returned", async () => {
  const result = await academicSearch("unknown", {
    searchImpl: async () => []
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("academic search rejects an empty query before source access", async () => {
  let called = false;
  const result = await academicSearch(" ", {
    searchImpl: async () => {
      called = true;
      return [];
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("academic search abstains without a configured source", async () => {
  const result = await academicSearch("sample paper");
  assert.equal(result.verdict, "insufficient_evidence");
});
