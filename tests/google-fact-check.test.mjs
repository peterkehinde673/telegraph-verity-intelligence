import test from "node:test";
import assert from "node:assert/strict";
import { googleFactCheck } from "../dist/providers/google-fact-check.js";

test("Google Fact Check adapter normalizes published reviews", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const parsed = new URL(String(url));
    assert.equal(parsed.pathname, "/v1alpha1/claims:search");
    assert.equal(parsed.searchParams.get("key"), "test-key");
    return new Response(JSON.stringify({ claims: [{ claimReview: [{ url: "https://example.com/fact-check", title: "Test review", reviewDate: "2026-10-06T00:00:00Z", textualRating: "False" }] }] }), { status: 200 });
  };
  try {
    const result = await googleFactCheck("A test claim", "test-key");
    assert.equal(result[0]?.claimReview?.[0]?.textualRating, "False");
  } finally { globalThis.fetch = original; }
});
