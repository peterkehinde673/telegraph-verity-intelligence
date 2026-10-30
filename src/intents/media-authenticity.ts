import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type MediaAuthenticitySignal = "provenance_consistent" | "provenance_inconsistent" | "indeterminate";

export interface MediaAuthenticityAnswer {
  media_type: "image" | "video" | "audio" | "unknown";
  signal: MediaAuthenticitySignal;
  indicators: string[];
}

export interface MediaAuthenticityOptions {
  verifyImpl?: (input: string) => Promise<{
    media_type: "image" | "video" | "audio" | "unknown";
    signal: MediaAuthenticitySignal;
    indicators: string[];
    source_id?: string;
  }>;
  now?: () => string;
}

export async function checkMediaAuthenticity(
  input: string,
  options: MediaAuthenticityOptions = {}
): Promise<VerityResponse<MediaAuthenticityAnswer>> {
  const normalized = input.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "MEDIA_AUTHENTICITY_CHECK",
      verdict: "rejected",
      confidence: 1,
      answer: { media_type: "unknown", signal: "indeterminate", indicators: [] },
      evidence: [],
      uncertainty: [{ code: "empty_input", message: "A media reference is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.verifyImpl) {
    return {
      intent: "MEDIA_AUTHENTICITY_CHECK",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { media_type: "unknown", signal: "indeterminate", indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "authenticity_source_unconfigured",
        message: "No media provenance or authenticity source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const verification = await options.verifyImpl(normalized);
    const sourceId = verification.source_id ?? "media-authenticity:verifier";

    return {
      intent: "MEDIA_AUTHENTICITY_CHECK",
      verdict:
        verification.signal === "provenance_consistent"
          ? "confirmed"
          : verification.signal === "provenance_inconsistent"
            ? "likely"
            : "insufficient_evidence",
      confidence: verification.signal === "indeterminate" ? 0 : 1,
      answer: {
        media_type: verification.media_type,
        signal: verification.signal,
        indicators: verification.indicators
      },
      evidence: verification.indicators.map((indicator, index) => normalizeEvidence({
        source_id: sourceId + ":" + index,
        source_type: "media-authenticity",
        title: "Media provenance indicator",
        excerpt: indicator,
        retrieved_at: retrievedAt
      })),
      uncertainty: [{
        code: "authenticity_is_not_proof",
        message: "A provenance-consistent or inconsistent signal is evidence about available integrity metadata, not absolute proof that media is genuine or manipulated."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "MEDIA_AUTHENTICITY_CHECK",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { media_type: "unknown", signal: "indeterminate", indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "authenticity_verification_failed",
        message: error instanceof Error ? error.message : "Media authenticity verification failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
