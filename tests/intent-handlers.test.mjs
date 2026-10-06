import test from "node:test";
import assert from "node:assert/strict";
import { INTENT_HANDLERS } from "../dist/intent-handlers.js";

test("all 20 scoped Intents have a router handler", () => {
  const expected = [
    "FACT_CHECK","RESEARCH_QUERY","RESEARCH_SYNTHESIS","NEWS_HEADLINES","ACADEMIC_SEARCH",
    "CONTENT_EXTRACTION","CONTENT_VERIFICATION","TEXT_AUTHENTICITY_CHECK","AI_TEXT_DETECTION",
    "DEEPFAKE_DETECTION","MEDIA_AUTHENTICITY_CHECK","IMAGE_VERIFICATION","VIDEO_VERIFICATION",
    "CONTENT_MODERATION","URL_SCAN","EMAIL_SECURITY","MALWARE_DETECTION","CVE_LOOKUP",
    "SSL_VERIFICATION","DNS_RECORD_LOOKUP"
  ];

  assert.equal(Object.keys(INTENT_HANDLERS).length, expected.length);
  for (const intent of expected) assert.equal(typeof INTENT_HANDLERS[intent], "function", intent);
});

test("provider-backed handlers abstain instead of performing an implicit external call", async () => {
  const result = await INTENT_HANDLERS.FACT_CHECK?.({ claim: "Example claim" });
  assert.equal(result?.verdict, "insufficient_evidence");
  assert.equal(result?.confidence, 0);
});
