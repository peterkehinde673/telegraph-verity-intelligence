import test from "node:test";
import assert from "node:assert/strict";

const expectedIntents = [
  "FACT_CHECK",
  "RESEARCH_QUERY",
  "RESEARCH_SYNTHESIS",
  "NEWS_HEADLINES",
  "ACADEMIC_SEARCH",
  "CONTENT_EXTRACTION",
  "CONTENT_VERIFICATION",
  "TEXT_AUTHENTICITY_CHECK",
  "AI_TEXT_DETECTION",
  "DEEPFAKE_DETECTION",
  "MEDIA_AUTHENTICITY_CHECK",
  "IMAGE_VERIFICATION",
  "VIDEO_VERIFICATION",
  "CONTENT_MODERATION",
  "URL_SCAN",
  "EMAIL_SECURITY",
  "MALWARE_DETECTION",
  "CVE_LOOKUP",
  "SSL_VERIFICATION",
  "DNS_RECORD_LOOKUP"
];

test("the initial Verity scope contains exactly 20 intents", () => {
  assert.equal(expectedIntents.length, 20);
  assert.equal(new Set(expectedIntents).size, 20);
});
