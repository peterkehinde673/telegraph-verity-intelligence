import test from "node:test";
import assert from "node:assert/strict";
import { checkUrlSafe } from "../dist/intents/url-safe.js";

test("URL_SAFE reports threat matches from the configured reputation provider", async () => {
  const result = await checkUrlSafe("https://bad.example/path", {
    now: () => "2026-10-12T00:00:00.000Z",
    lookupImpl: async () => [{ threat_type: "SOCIAL_ENGINEERING", platform_type: "ANY_PLATFORM", threat_entry: "https://bad.example/path" }]
  });

  assert.equal(result.intent, "URL_SAFE");
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.safe_on_checked_feeds, false);
  assert.equal(result.answer.matches[0]?.threat_type, "SOCIAL_ENGINEERING");
  assert.equal(result.evidence.length, 1);
});

test("URL_SAFE does not claim safety when no reputation provider is configured", async () => {
  const result = await checkUrlSafe("https://example.com", {
    now: () => "2026-10-12T00:00:00.000Z"
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.answer.safe_on_checked_feeds, false);
});

test("URL_SAFE rejects invalid and non-HTTP URLs", async () => {
  const invalid = await checkUrlSafe("not a URL");
  const unsupported = await checkUrlSafe("file:///etc/passwd");

  assert.equal(invalid.verdict, "rejected");
  assert.equal(unsupported.verdict, "rejected");
});


test("URL_SAFE does not expose raw reputation provider errors", async () => {
  const result = await checkUrlSafe("https://example.com", {
    now: () => "2026-10-18T00:00:00.000Z",
    lookupImpl: async () => {
      throw new Error("private provider endpoint https://feed.invalid/?token=url-safe-secret-7");
    }
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "reputation_lookup_failed");
  assert.equal(result.uncertainty[0]?.message, "The configured URL reputation source failed or returned an invalid response.");
  assert.doesNotMatch(result.uncertainty[0]?.message ?? "", /url-safe-secret-7|feed\.invalid/);
  assert.deepEqual(result.evidence, []);
});
