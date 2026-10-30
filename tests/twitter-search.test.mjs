import test from "node:test";
import assert from "node:assert/strict";
import { twitterSearch } from "../dist/intents/twitter-search.js";

const now = () => "2026-10-19T12:00:00.000Z";
const post = {
  id: "123456789",
  text: "People discuss this public topic.",
  url: "https://x.com/source_user/status/123456789",
  author_username: "source_user",
  published_at: "2026-10-19T11:00:00.000Z",
  source_id: "x-post:123456789",
  source_type: "x-recent-search"
};

test("TWITTER_SEARCH returns post links, timestamps and provenance without asserting truth", async () => {
  let receivedQuery;
  const result = await twitterSearch("  public topic  ", {
    now,
    searchImpl: async query => { receivedQuery = query; return [post]; }
  });
  assert.equal(receivedQuery, "public topic");
  assert.equal(result.intent, "TWITTER_SEARCH");
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.results[0].url, post.url);
  assert.equal(result.evidence[0].source_id, post.source_id);
  assert.equal(result.evidence[0].source_type, "x-recent-search");
  assert.equal(result.evidence[0].published_at, post.published_at);
  assert.equal(result.evidence[0].retrieved_at, now());
  assert.equal(result.uncertainty[0].code, "recent_platform_search_only");
});

test("TWITTER_SEARCH rejects missing, malformed and overlong inputs before provider access", async () => {
  let called = false;
  const searchImpl = async () => { called = true; return []; };
  const empty = await twitterSearch("  ", { now, searchImpl });
  const malformed = await twitterSearch({ query: "x" }, { now, searchImpl });
  const long = await twitterSearch("x".repeat(501), { now, searchImpl });
  assert.equal(empty.verdict, "rejected");
  assert.equal(malformed.uncertainty[0].code, "invalid_query");
  assert.equal(long.uncertainty[0].code, "query_too_long");
  assert.equal(called, false);
});

test("TWITTER_SEARCH abstains without a configured source or for empty results", async () => {
  const unconfigured = await twitterSearch("a topic", { now });
  const empty = await twitterSearch("a topic", { now, searchImpl: async () => [] });
  assert.equal(unconfigured.verdict, "insufficient_evidence");
  assert.equal(unconfigured.uncertainty[0].code, "twitter_search_source_unconfigured");
  assert.equal(empty.verdict, "insufficient_evidence");
  assert.equal(empty.uncertainty[0].code, "no_twitter_results");
  assert.deepEqual(empty.evidence, []);
});

test("TWITTER_SEARCH sanitizes failures and rejects malformed result collections and links", async () => {
  const failure = await twitterSearch("topic", { now, searchImpl: async () => { throw new Error("secret-token"); } });
  const malformed = await twitterSearch("topic", { now, searchImpl: async () => null });
  const unsafe = await twitterSearch("topic", {
    now,
    searchImpl: async () => [
      { ...post, url: "https://evil.example/post" },
      { ...post, source_id: "wrong-id" }
    ]
  });
  assert.equal(failure.uncertainty[0].code, "twitter_search_failed");
  assert.equal(JSON.stringify(failure).includes("secret-token"), false);
  assert.equal(malformed.uncertainty[0].code, "twitter_search_failed");
  assert.equal(unsafe.verdict, "insufficient_evidence");
  assert.equal(unsafe.evidence.length, 0);
});

test("TWITTER_SEARCH bounds result count", async () => {
  const many = Array.from({ length: 8 }, (_, index) => ({
    ...post,
    id: String(100 + index),
    source_id: `x-post:${100 + index}`,
    url: `https://x.com/source_user/status/${100 + index}`
  }));
  const result = await twitterSearch("topic", { now, searchImpl: async () => many });
  assert.equal(result.answer.results.length, 5);
  assert.equal(result.evidence.length, 5);
});
