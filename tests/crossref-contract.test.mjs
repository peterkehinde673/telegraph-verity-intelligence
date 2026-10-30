import test from "node:test";
import assert from "node:assert/strict";
import { crossrefSearch } from "../dist/providers/public-sources.js";

test("Crossref normalizes DOI authors and valid publication dates", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    message: { items: [{
      DOI: "10.1234/example",
      title: ["Example Paper"],
      URL: "https://doi.org/10.1234/example",
      author: [{ given: "Ada", family: "Lovelace" }],
      published: { "date-parts": [[2026, 10, 7]] }
    }] }
  }), { status: 200 });
  try {
    const result = await crossrefSearch("example");
    assert.equal(result[0]?.source_id, "doi:10.1234/example");
    assert.deepEqual(result[0]?.authors, ["Ada Lovelace"]);
    assert.equal(result[0]?.published_at, "2026-10-07T00:00:00.000Z");
  } finally { globalThis.fetch = original; }
});

test("Crossref does not fabricate dates from invalid years", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    message: { items: [{ title: ["No Date"], URL: "https://example.com/paper", published: { "date-parts": [[0]] } }] }
  }), { status: 200 });
  try {
    const result = await crossrefSearch("no date");
    assert.equal(result[0]?.published_at, null);
  } finally { globalThis.fetch = original; }
});
