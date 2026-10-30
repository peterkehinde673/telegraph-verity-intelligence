import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type AuthenticitySignal = "consistent" | "inconsistent" | "unknown";

export interface TextAuthenticityAnswer {
  text: string;
  signal: AuthenticitySignal;
  indicators: string[];
}

export interface TextAuthenticityOptions {
  analyzeImpl?: (text: string) => Promise<{
    signal: AuthenticitySignal;
    indicators: string[];
    source_id?: string;
  }>;
  now?: () => string;
}

export async function checkTextAuthenticity(
  text: string,
  options: TextAuthenticityOptions = {}
): Promise<VerityResponse<TextAuthenticityAnswer>> {
  const normalized = text.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "TEXT_AUTHENTICITY_CHECK",
      verdict: "rejected",
      confidence: 1,
      answer: { text: "", signal: "unknown", indicators: [] },
      evidence: [],
      uncertainty: [{ code: "empty_content", message: "Text to assess is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.analyzeImpl) {
    return {
      intent: "TEXT_AUTHENTICITY_CHECK",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { text: normalized, signal: "unknown", indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "authenticity_source_unconfigured",
        message: "No text-authenticity analysis source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const analysis = await options.analyzeImpl(normalized);
    const sourceId = analysis.source_id ?? "text-authenticity:classifier";

    return {
      intent: "TEXT_AUTHENTICITY_CHECK",
      verdict:
        analysis.signal === "consistent"
          ? "confirmed"
          : analysis.signal === "inconsistent"
            ? "likely"
            : "insufficient_evidence",
      confidence: analysis.signal === "unknown" ? 0 : 1,
      answer: {
        text: normalized,
        signal: analysis.signal,
        indicators: analysis.indicators
      },
      evidence: analysis.indicators.map((indicator, index) => normalizeEvidence({
        source_id: sourceId + ":" + index,
        source_type: "text-authenticity",
        title: "Authenticity indicator",
        excerpt: indicator,
        retrieved_at: retrievedAt
      })),
      uncertainty: analysis.signal === "unknown" ? [{
        code: "authenticity_indeterminate",
        message: "The configured analysis source could not establish a consistent or inconsistent authenticity signal."
      }] : [],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "TEXT_AUTHENTICITY_CHECK",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { text: normalized, signal: "unknown", indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "authenticity_lookup_failed",
        message: error instanceof Error ? error.message : "Text-authenticity analysis failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
