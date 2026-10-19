import test from "node:test";
import assert from "node:assert/strict";
import { webSearch } from "../dist/intents/web-search.js";

const now = () => "2026-10-19T12:00:00.000Z";

test("WEB_SEARCH returns attributable results and preserves provenance", async () => {
  let receivedQuery;
  const result = await webSearch("  current climate policy  ", {
    now,
    searchImpl: async query => {
      receivedQuery = query;
      return [{
        title: "Policy update",
        url: "https://news.example/policy",
        excerpt: "A search result summary.",
        source_id: "jina-search:https://news.example/policy",
        source_type: "jina-web-search",
        published_at: "2026-10-19T10:00:00.000Z"
      }];
    }
  });

  assert.equal(receivedQuery, "current climate policy");
  assert.equal(result.intent, "WEB_SEARCH");
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.results.length, 1);
  assert.equal(result.answer.results[0].url, "https://news.example/policy");
  assert.equal(result.evidence[0].source_id, "jina-search:https://news.example/policy");
  assert.equal(result.evidence[0].source_type, "jina-web-search");
  assert.equal(result.evidence[0].published_at, "2026-10-19T10:00:00.000Z");
  assert.equal(result.evidence[0].retrieved_at, now());
  assert.equal(result.uncertainty[0].code, "search_results_are_not_verification");
});

test("WEB_SEARCH rejects empty, malformed, and overlong queries without provider access", async () => {
  let called = false;
  const searchImpl = async () => { called = true; return []; };
  const empty = await webSearch("  ", { searchImpl, now });
  const malformed = await webSearch(42, { searchImpl, now });
  const tooLong = await webSearch("x".repeat(501), { searchImpl, now });

  assert.equal(empty.verdict, "rejected");
  assert.equal(empty.uncertainty[0].code, "empty_query");
  assert.equal(malformed.verdict, "rejected");
  assert.equal(malformed.uncertainty[0].code, "invalid_query");
  assert.equal(tooLong.verdict, "rejected");
  assert.equal(tooLong.uncertainty[0].code, "query_too_long");
  assert.equal(tooLong.answer.query.length, 500);
  assert.equal(called, false);
});

test("WEB_SEARCH abstains when no Jina credential or injected source is configured", async () => {
  const result = await webSearch("a current event", { now });
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0].code, "web_search_source_unconfigured");
  assert.deepEqual(result.evidence, []);
});

test("WEB_SEARCH abstains when the provider returns no results", async () => {
  const result = await webSearch("a current event", { now, searchImpl: async () => [] });
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0].code, "no_web_results");
  assert.deepEqual(result.evidence, []);
});

test("WEB_SEARCH sanitizes provider failures and malformed response data", async () => {
  const failed = await webSearch("query", {
    now,
    searchImpl: async () => { throw new Error("private token secret-value"); }
  });
  const malformed = await webSearch("query", {
    now,
    searchImpl: async () => null
  });

  assert.equal(failed.verdict, "insufficient_evidence");
  assert.equal(failed.uncertainty[0].code, "web_search_failed");
  assert.equal(failed.uncertainty[0].message.includes("secret-value"), false);
  assert.equal(malformed.verdict, "insufficient_evidence");
  assert.equal(malformed.uncertainty[0].code, "web_search_failed");
  assert.deepEqual(malformed.evidence, []);
});

test("WEB_SEARCH filters malformed records and bounds the returned result count", async () => {
  const result = await webSearch("query", {
    now,
    max_results: 1,
    searchImpl: async () => [
      { title: "unsafe", url: "file:///etc/passwd", source_id: "bad" },
      { title: "valid", url: "https://news.example/valid", source_id: "source:valid" },
      { title: "second", url: "https://news.example/second", source_id: "source:second" }
    ]
  });
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.results.length, 1);
  assert.equal(result.answer.results[0].source_id, "source:valid");
});
