import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface ContentExtractionAnswer {
  source: string;
  content: string;
  content_type: string;
  title: string | null;
}

export interface ContentExtractionOptions {
  extractImpl?: (source: string) => Promise<{
    content: string;
    content_type: string;
    title?: string | null;
    source_id?: string;
    url?: string | null;
  }>;
  now?: () => string;
}

export async function contentExtraction(
  source: string,
  options: ContentExtractionOptions = {}
): Promise<VerityResponse<ContentExtractionAnswer>> {
  const normalized = source.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "CONTENT_EXTRACTION",
      verdict: "rejected",
      confidence: 1,
      answer: { source: "", content: "", content_type: "", title: null },
      evidence: [],
      uncertainty: [{ code: "empty_source", message: "A content source is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.extractImpl) {
    return {
      intent: "CONTENT_EXTRACTION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { source: normalized, content: "", content_type: "", title: null },
      evidence: [],
      uncertainty: [{
        code: "extraction_source_unconfigured",
        message: "No content extraction source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const extracted = await options.extractImpl(normalized);
    const content = extracted.content.trim();

    if (!content) {
      return {
        intent: "CONTENT_EXTRACTION",
        verdict: "insufficient_evidence",
        confidence: 0,
        answer: {
          source: normalized,
          content: "",
          content_type: extracted.content_type,
          title: extracted.title ?? null
        },
        evidence: [],
        uncertainty: [{
          code: "empty_extraction",
          message: "The configured extractor returned no content."
        }],
        retrieved_at: retrievedAt
      };
    }

    const evidence = [normalizeEvidence({
      source_id: extracted.source_id ?? normalized,
      source_type: extracted.content_type || "extracted-content",
      title: extracted.title ?? normalized,
      url: extracted.url ?? null,
      excerpt: content,
      retrieved_at: retrievedAt
    })];

    return {
      intent: "CONTENT_EXTRACTION",
      verdict: "confirmed",
      confidence: 1,
      answer: {
        source: normalized,
        content,
        content_type: extracted.content_type,
        title: extracted.title ?? null
      },
      evidence,
      uncertainty: [],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "CONTENT_EXTRACTION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { source: normalized, content: "", content_type: "", title: null },
      evidence: [],
      uncertainty: [{
        code: "content_extraction_failed",
        message: error instanceof Error ? error.message : "Content extraction failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
