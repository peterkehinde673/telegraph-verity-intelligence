import test from "node:test";
import assert from "node:assert/strict";
import { wikipediaSearch, crossrefSearch, googleNewsRss } from "../dist/providers/public-sources.js";

test("public provider adapters normalize Wikipedia search results", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    pages: [{ id: 42, key: "Test_page", title: "Test page", description: "A test page" }]
  }), { status: 200 });
  try {
    const result = await wikipediaSearch("test");
    assert.equal(result[0]?.source_id, "wikipedia:42");
    assert.equal(result[0]?.url, "https://en.wikipedia.org/wiki/Test_page");
  } finally { globalThis.fetch = original; }
});

test("public provider adapters normalize Crossref records", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    message: { items: [{ DOI: "10.1234/test", title: ["A paper"], URL: "https://doi.org/10.1234/test", author: [{ given: "A", family: "Researcher" }] }] }
  }), { status: 200 });
  try {
    const result = await crossrefSearch("test");
    assert.equal(result[0]?.source_id, "doi:10.1234/test");
    assert.deepEqual(result[0]?.authors, ["A Researcher"]);
  } finally { globalThis.fetch = original; }
});

test("public news adapter extracts RSS headlines", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<rss><channel><item><title>Example headline</title><link>https://example.com/news</link><pubDate>Tue, 06 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>", { status: 200 });
  try {
    const result = await googleNewsRss("example");
    assert.equal(result[0]?.title, "Example headline");
    assert.equal(result[0]?.source_id, "google-news:https://example.com/news");
  } finally { globalThis.fetch = original; }
});
