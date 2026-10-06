import type { IntentHandler } from "./api.js";
import type { VerityIntent } from "./intents/catalogue.js";
import { factCheck } from "./intents/fact-check.js";
import { researchQuery } from "./intents/research-query.js";
import { researchSynthesis } from "./intents/research-synthesis.js";
import { newsHeadlines } from "./intents/news-headlines.js";
import { academicSearch } from "./intents/academic-search.js";
import { contentExtraction } from "./intents/content-extraction.js";
import { contentVerification } from "./intents/content-verification.js";
import { checkTextAuthenticity } from "./intents/text-authenticity.js";
import { detectAiText } from "./intents/ai-text-detection.js";
import { detectDeepfake } from "./intents/deepfake-detection.js";
import { checkMediaAuthenticity } from "./intents/media-authenticity.js";
import { verifyImage } from "./intents/image-verification.js";
import { verifyVideo } from "./intents/video-verification.js";
import { moderateContent } from "./intents/content-moderation.js";
import { scanUrl } from "./intents/url-scan.js";
import { checkEmailSecurity } from "./intents/email-security.js";
import { detectMalware } from "./intents/malware-detection.js";
import { lookupCve } from "./intents/cve-lookup.js";
import { verifySsl } from "./intents/ssl-verification.js";
import { lookupDnsRecord } from "./intents/dns-record-lookup.js";

function stringInput(input: unknown, field: string): string {
  if (typeof input === "string") return input;
  if (input && typeof input === "object") {
    const value = (input as Record<string, unknown>)[field];
    if (typeof value === "string") return value;
  }
  return "";
}

function objectInput(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? input as Record<string, unknown> : {};
}

function handler<T extends VerityIntent>(
  fn: (input: unknown) => Promise<ReturnType<IntentHandler> extends Promise<infer R> ? R : never>
): IntentHandler {
  return fn as IntentHandler;
}

export const INTENT_HANDLERS: Partial<Record<VerityIntent, IntentHandler>> = {
  FACT_CHECK: handler(async (input) => factCheck(stringInput(input, "claim"))),
  RESEARCH_QUERY: handler(async (input) => researchQuery(stringInput(input, "query"))),
  RESEARCH_SYNTHESIS: handler(async (input) => {
    const value = objectInput(input);
    const evidence = Array.isArray(value.evidence) ? value.evidence as never[] : [];
    return researchSynthesis(stringInput(input, "question"), { evidence: evidence as never });
  }),
  NEWS_HEADLINES: handler(async (input) => newsHeadlines(stringInput(input, "topic"))),
  ACADEMIC_SEARCH: handler(async (input) => academicSearch(stringInput(input, "query"))),
  CONTENT_EXTRACTION: handler(async (input) => contentExtraction(stringInput(input, "source"))),
  CONTENT_VERIFICATION: handler(async (input) => contentVerification(stringInput(input, "content"))),
  TEXT_AUTHENTICITY_CHECK: handler(async (input) => checkTextAuthenticity(stringInput(input, "text"))),
  AI_TEXT_DETECTION: handler(async (input) => detectAiText(stringInput(input, "text"))),
  DEEPFAKE_DETECTION: handler(async (input) => detectDeepfake(stringInput(input, "input"))),
  MEDIA_AUTHENTICITY_CHECK: handler(async (input) => checkMediaAuthenticity(stringInput(input, "input"))),
  IMAGE_VERIFICATION: handler(async (input) => verifyImage(stringInput(input, "input"))),
  VIDEO_VERIFICATION: handler(async (input) => verifyVideo(stringInput(input, "input"))),
  CONTENT_MODERATION: handler(async (input) => moderateContent(stringInput(input, "text"))),
  URL_SCAN: handler(async (input) => scanUrl(stringInput(input, "url"))),
  EMAIL_SECURITY: handler(async (input) => checkEmailSecurity(stringInput(input, "domain"))),
  MALWARE_DETECTION: handler(async (input) => detectMalware(stringInput(input, "indicator"))),
  CVE_LOOKUP: handler(async (input) => lookupCve(stringInput(input, "cve_id"))),
  SSL_VERIFICATION: handler(async (input) => {
    const value = objectInput(input);
    const port = typeof value.port === "number" ? value.port : 443;
    return verifySsl(stringInput(input, "hostname"), port);
  }),
  DNS_RECORD_LOOKUP: handler(async (input) => {
    const value = objectInput(input);
    const recordType = typeof value.record_type === "string" ? value.record_type.toUpperCase() : "A";
    return lookupDnsRecord(stringInput(input, "hostname"), recordType as never);
  })
};
