import test from "node:test";
import assert from "node:assert/strict";
import { xRecentSearch } from "../dist/providers/x-search.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("X recent search requests the documented endpoint and maps attributable post records", async () => {
  let requestUrl;
  let requestInit;
  const results = await xRecentSearch("climate policy", {
    bearerToken: "test-token",
    fetchImpl: async (url, init) => {
      requestUrl = new URL(url);
      requestInit = init;
      return jsonResponse({
        data: [{ id: "1234567890123", text: "Public post text", author_id: "42", created_at: "2026-10-19T10:00:00Z" }],
        includes: { users: [{ id: "42", username: "news_source" }] },
        meta: { result_count: 1 }
      });
    }
  });

  assert.equal(requestUrl.origin, "https://api.x.com");
  assert.equal(requestUrl.pathname, "/2/tweets/search/recent");
  assert.equal(requestUrl.searchParams.get("query"), "climate policy");
  assert.equal(requestUrl.searchParams.get("max_results"), "10");
  assert.equal(requestUrl.searchParams.get("post.fields"), "created_at,author_id,text");
  assert.equal(requestInit.method, "GET");
  assert.equal(requestInit.headers.authorization, "Bearer test-token");
  assert.equal(requestInit.redirect, "error");
  assert.ok(requestInit.signal);
  assert.deepEqual(results, [{
    id: "1234567890123",
    text: "Public post text",
    url: "https://x.com/news_source/status/1234567890123",
    author_username: "news_source",
    published_at: "2026-10-19T10:00:00.000Z",
    source_id: "x-post:1234567890123",
    source_type: "x-recent-search"
  }]);
});

test("X provider uses a stable status URL when author expansion is absent and caps records", async () => {
  const results = await xRecentSearch("query", {
    bearerToken: "test-token",
    fetchImpl: async () => jsonResponse({ data: Array.from({ length: 8 }, (_, index) => ({
      id: String(1000 + index), text: `Post ${index}`
    })) })
  });
  assert.equal(results.length, 5);
  assert.equal(results[0].url, "https://x.com/i/web/status/1000");
  assert.equal(results[0].published_at, null);
});

test("X provider rejects empty credentials, HTTP failures and malformed provider envelopes", async () => {
  await assert.rejects(() => xRecentSearch("query", { bearerToken: "  " }), /not_configured/);
  await assert.rejects(() => xRecentSearch("query", {
    bearerToken: "secret-token",
    fetchImpl: async () => jsonResponse({ error: "private" }, 403)
  }), /HTTP 403/);
  await assert.rejects(() => xRecentSearch("query", {
    bearerToken: "test-token",
    fetchImpl: async () => jsonResponse({ data: "not-an-array" })
  }), /invalid response/);
  await assert.rejects(() => xRecentSearch("query", {
    bearerToken: "test-token",
    fetchImpl: async () => new Response("not-json")
  }));
});

test("X provider returns an empty list for no posts and rejects oversized responses", async () => {
  const empty = await xRecentSearch("query", {
    bearerToken: "test-token",
    fetchImpl: async () => jsonResponse({ data: [] })
  });
  assert.deepEqual(empty, []);

  const oversized = new Response(JSON.stringify({ data: [] }) + " ".repeat(512 * 1024));
  await assert.rejects(() => xRecentSearch("query", {
    bearerToken: "test-token",
    fetchImpl: async () => oversized
  }), /exceeded the configured limit/);
});

test("X provider filters malformed posts and unsafe identifiers", async () => {
  const results = await xRecentSearch("query", {
    bearerToken: "test-token",
    fetchImpl: async () => jsonResponse({ data: [
      { id: "javascript:alert(1)", text: "unsafe" },
      { id: "42", text: "valid post" },
      { id: "43", text: "   " },
      null
    ] })
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].source_id, "x-post:42");
});
