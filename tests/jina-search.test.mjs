import test from "node:test";
import assert from "node:assert/strict";
import { jinaWebSearch } from "../dist/providers/jina-search.js";

test("Jina Search sends a bounded, authenticated JSON search request and normalizes attribution", async () => {
  let request;
  const results = await jinaWebSearch("current climate policy", {
    apiKey: "test-key",
    fetchImpl: async (url, init) => {
      request = { url: new URL(url), init };
      return new Response(JSON.stringify({
        code: 200,
        status: 20000,
        data: [{
          title: "Policy update",
          description: "A search result summary.",
          url: "https://news.example/policy",
          publishedTime: "2026-10-19T10:00:00Z",
          content: "This field is not requested by the adapter."
        }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });

  assert.equal(request.url.hostname, "s.jina.ai");
  assert.equal(request.url.searchParams.get("q"), "current climate policy");
  assert.equal(request.init.method, "GET");
  assert.equal(request.init.headers.authorization, "Bearer test-key");
  assert.equal(request.init.headers.accept, "application/json");
  assert.equal(request.init.headers["x-respond-with"], "no-content");
  assert.ok(request.init.signal instanceof AbortSignal);
  assert.deepEqual(results, [{
    title: "Policy update",
    url: "https://news.example/policy",
    excerpt: "A search result summary.",
    published_at: "2026-10-19T10:00:00.000Z",
    source_id: "jina-search:https://news.example/policy",
    source_type: "jina-web-search"
  }]);
});

test("Jina Search accepts an empty data list as an empty result set", async () => {
  const results = await jinaWebSearch("query", {
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ code: 200, status: 20000, data: [] }), { status: 200 })
  });
  assert.deepEqual(results, []);
});

test("Jina Search rejects missing credentials without making a request", async () => {
  let called = false;
  await assert.rejects(jinaWebSearch("query", {
    apiKey: "  ",
    fetchImpl: async () => { called = true; return new Response("{}"); }
  }), /web_search_not_configured/);
  assert.equal(called, false);
});

test("Jina Search rejects non-success HTTP responses", async () => {
  await assert.rejects(jinaWebSearch("query", {
    apiKey: "test-key",
    fetchImpl: async () => new Response("{}", { status: 429 })
  }), /HTTP 429/);
});

test("Jina Search rejects malformed JSON and response envelopes", async () => {
  await assert.rejects(jinaWebSearch("query", {
    apiKey: "test-key",
    fetchImpl: async () => new Response("not-json", { status: 200 })
  }));
  await assert.rejects(jinaWebSearch("query", {
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ code: 200, data: {} }), { status: 200 })
  }), /invalid response/);
});

test("Jina Search rejects oversized provider responses", async () => {
  const body = JSON.stringify({
    code: 200,
    data: [{ title: "Result", url: "https://news.example/result", description: "x".repeat(600_000) }]
  });
  await assert.rejects(jinaWebSearch("query", {
    apiKey: "test-key",
    fetchImpl: async () => new Response(body, { status: 200 })
  }), /exceeded the configured limit/);
});

test("Jina Search drops malformed and unsafe result records", async () => {
  const results = await jinaWebSearch("query", {
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({
      code: 200,
      data: [
        { title: "", url: "https://news.example/empty-title" },
        { title: "Unsafe", url: "javascript:alert(1)" },
        { title: "Credential URL", url: "https://user:pass@news.example/article" },
        null,
        { title: "Valid", url: "https://news.example/valid", publishedTime: "not a date" }
      ]
    }), { status: 200 })
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "Valid");
  assert.equal(results[0].published_at, null);
});
