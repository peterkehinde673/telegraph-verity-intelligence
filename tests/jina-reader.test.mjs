import test from "node:test";
import assert from "node:assert/strict";
import { readUrl } from "../dist/providers/jina-reader.js";

test("Jina Reader extracts an HTTP URL with stable provenance", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://r.jina.ai/https://example.com/article");
    assert.equal(new Headers(init?.headers).get("accept"), "text/plain");
    return new Response("# Example Article\n\nBody", { status: 200 });
  };
  try {
    const result = await readUrl("https://example.com/article");
    assert.equal(result.content, "# Example Article\n\nBody");
    assert.equal(result.source_id, "jina-reader:https://example.com/article");
  } finally { globalThis.fetch = original; }
});

test("Jina Reader rejects non-web URLs before network access", async () => {
  let called = false;
  await assert.rejects(
    () => readUrl("file:///tmp/test", undefined, async () => {
      called = true;
      return new Response("unexpected");
    }),
    /Only HTTP and HTTPS/
  );
  assert.equal(called, false);
});
