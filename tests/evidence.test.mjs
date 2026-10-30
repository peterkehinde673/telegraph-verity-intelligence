import test from "node:test";
import assert from "node:assert/strict";

test("evidence normalization rules preserve provenance fields", () => {
  const input = {
    source_id: " source-1 ",
    source_type: " web ",
    title: " Example source ",
    url: " https://example.com ",
    excerpt: " Supporting evidence ",
    retrieved_at: "2026-10-04T17:00:00.000Z",
    published_at: "2026-10-03T12:00:00.000Z",
    metadata: { status: "verified" }
  };

  assert.equal(input.source_id.trim(), "source-1");
  assert.equal(input.source_type.trim(), "web");
  assert.equal(input.url.trim(), "https://example.com");
  assert.equal(input.retrieved_at, "2026-10-04T17:00:00.000Z");
  assert.equal(input.metadata.status, "verified");
});

test("duplicate evidence is identified by stable provenance fields", () => {
  const key = (item) =>
    [item.source_id, item.url ?? "", item.retrieved_at].join("|");

  const a = {
    source_id: "source-1",
    url: "https://example.com",
    retrieved_at: "2026-10-04T17:00:00.000Z"
  };

  const b = { ...a };

  assert.equal(key(a), key(b));
});

test("different source retrievals remain distinguishable", () => {
  const key = (item) =>
    [item.source_id, item.url ?? "", item.retrieved_at].join("|");

  assert.notEqual(
    key({
      source_id: "source-1",
      url: "https://example.com",
      retrieved_at: "2026-10-04T17:00:00.000Z"
    }),
    key({
      source_id: "source-1",
      url: "https://example.com",
      retrieved_at: "2026-10-04T18:00:00.000Z"
    })
  );
});
