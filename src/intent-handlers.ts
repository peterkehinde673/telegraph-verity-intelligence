import type { IntentHandler } from "./api.js";
import type { VerityIntent } from "./intents/catalogue.js";
import { factCheck, type FactCheckOptions } from "./intents/fact-check.js";
import { researchQuery, type ResearchQueryOptions } from "./intents/research-query.js";
import { researchSynthesis, type ResearchSynthesisOptions } from "./intents/research-synthesis.js";
import { newsHeadlines, type NewsHeadlinesOptions } from "./intents/news-headlines.js";
import { academicSearch, type AcademicSearchOptions } from "./intents/academic-search.js";
import { contentExtraction, type ContentExtractionOptions } from "./intents/content-extraction.js";
import { contentVerification, type ContentVerificationOptions } from "./intents/content-verification.js";
import { checkTextAuthenticity, type TextAuthenticityOptions } from "./intents/text-authenticity.js";
import { detectAiText, type AiTextDetectionOptions } from "./intents/ai-text-detection.js";
import { detectDeepfake, type DeepfakeDetectionOptions } from "./intents/deepfake-detection.js";
import { checkMediaAuthenticity, type MediaAuthenticityOptions } from "./intents/media-authenticity.js";
import { verifyImage, type ImageVerificationOptions } from "./intents/image-verification.js";
import { verifyVideo, type VideoVerificationOptions } from "./intents/video-verification.js";
import { moderateContent, type ContentModerationOptions } from "./intents/content-moderation.js";
import { scanUrl, type UrlScanOptions } from "./intents/url-scan.js";
import { checkEmailSecurity, type EmailSecurityOptions } from "./intents/email-security.js";
import { detectMalware, type MalwareDetectionOptions } from "./intents/malware-detection.js";
import { lookupCve, type CveLookupOptions } from "./intents/cve-lookup.js";
import { verifySsl, type SslVerificationOptions } from "./intents/ssl-verification.js";
import { lookupDnsRecord, type DnsRecordLookupOptions } from "./intents/dns-record-lookup.js";

export interface IntentProviderDependencies {
  FACT_CHECK?: FactCheckOptions;
  RESEARCH_QUERY?: ResearchQueryOptions;
  RESEARCH_SYNTHESIS?: ResearchSynthesisOptions;
  NEWS_HEADLINES?: NewsHeadlinesOptions;
  ACADEMIC_SEARCH?: AcademicSearchOptions;
  CONTENT_EXTRACTION?: ContentExtractionOptions;
  CONTENT_VERIFICATION?: ContentVerificationOptions;
  TEXT_AUTHENTICITY_CHECK?: TextAuthenticityOptions;
  AI_TEXT_DETECTION?: AiTextDetectionOptions;
  DEEPFAKE_DETECTION?: DeepfakeDetectionOptions;
  MEDIA_AUTHENTICITY_CHECK?: MediaAuthenticityOptions;
  IMAGE_VERIFICATION?: ImageVerificationOptions;
  VIDEO_VERIFICATION?: VideoVerificationOptions;
  CONTENT_MODERATION?: ContentModerationOptions;
  URL_SCAN?: UrlScanOptions;
  EMAIL_SECURITY?: EmailSecurityOptions;
  MALWARE_DETECTION?: MalwareDetectionOptions;
  CVE_LOOKUP?: CveLookupOptions;
  SSL_VERIFICATION?: SslVerificationOptions;
  DNS_RECORD_LOOKUP?: DnsRecordLookupOptions;
}

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

function handler(
  fn: (input: unknown) => ReturnType<IntentHandler>
): IntentHandler {
  return fn;
}

export function createIntentHandlers(
  providers: IntentProviderDependencies = {}
): Partial<Record<VerityIntent, IntentHandler>> {
  return {
    FACT_CHECK: handler((input) => factCheck(stringInput(input, "claim"), providers.FACT_CHECK)),
    RESEARCH_QUERY: handler((input) => researchQuery(stringInput(input, "query"), providers.RESEARCH_QUERY)),
    RESEARCH_SYNTHESIS: handler((input) => {
      const value = objectInput(input);
      const evidence = Array.isArray(value.evidence) ? value.evidence as never[] : [];
      return researchSynthesis(stringInput(input, "question"), {
        ...providers.RESEARCH_SYNTHESIS,
        evidence: evidence as never
      });
    }),
    NEWS_HEADLINES: handler((input) => newsHeadlines(stringInput(input, "topic"), providers.NEWS_HEADLINES)),
    ACADEMIC_SEARCH: handler((input) => academicSearch(stringInput(input, "query"), providers.ACADEMIC_SEARCH)),
    CONTENT_EXTRACTION: handler((input) => contentExtraction(stringInput(input, "source"), providers.CONTENT_EXTRACTION)),
    CONTENT_VERIFICATION: handler((input) => contentVerification(stringInput(input, "content"), providers.CONTENT_VERIFICATION)),
    TEXT_AUTHENTICITY_CHECK: handler((input) => checkTextAuthenticity(stringInput(input, "text"), providers.TEXT_AUTHENTICITY_CHECK)),
    AI_TEXT_DETECTION: handler((input) => detectAiText(stringInput(input, "text"), providers.AI_TEXT_DETECTION)),
    DEEPFAKE_DETECTION: handler((input) => detectDeepfake(stringInput(input, "input"), providers.DEEPFAKE_DETECTION)),
    MEDIA_AUTHENTICITY_CHECK: handler((input) => checkMediaAuthenticity(stringInput(input, "input"), providers.MEDIA_AUTHENTICITY_CHECK)),
    IMAGE_VERIFICATION: handler((input) => verifyImage(stringInput(input, "input"), providers.IMAGE_VERIFICATION)),
    VIDEO_VERIFICATION: handler((input) => verifyVideo(stringInput(input, "input"), providers.VIDEO_VERIFICATION)),
    CONTENT_MODERATION: handler((input) => moderateContent(stringInput(input, "text"), providers.CONTENT_MODERATION)),
    URL_SCAN: handler((input) => scanUrl(stringInput(input, "url"), providers.URL_SCAN)),
    EMAIL_SECURITY: handler((input) => checkEmailSecurity(stringInput(input, "domain"), providers.EMAIL_SECURITY)),
    MALWARE_DETECTION: handler((input) => detectMalware(stringInput(input, "indicator"), providers.MALWARE_DETECTION)),
    CVE_LOOKUP: handler((input) => lookupCve(stringInput(input, "cve_id"), providers.CVE_LOOKUP)),
    SSL_VERIFICATION: handler((input) => {
      const value = objectInput(input);
      const port = typeof value.port === "number" ? value.port : 443;
      return verifySsl(stringInput(input, "hostname"), port, providers.SSL_VERIFICATION);
    }),
    DNS_RECORD_LOOKUP: handler((input) => {
      const value = objectInput(input);
      const recordType = typeof value.record_type === "string"
        ? value.record_type.toUpperCase()
        : "A";
      return lookupDnsRecord(stringInput(input, "hostname"), recordType as never, providers.DNS_RECORD_LOOKUP);
    })
  };
}

export const INTENT_HANDLERS = createIntentHandlers();
