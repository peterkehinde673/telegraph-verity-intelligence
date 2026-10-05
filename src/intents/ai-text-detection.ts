import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type AiTextDetectionSignal = "ai_likely" | "human_likely" | "indeterminate";

export interface AiTextDetectionAnswer {
  text: string;
  signal: AiTextDetectionSignal;
  ai_probability: number | null;
  indicators: string[];
}

export interface AiTextDetectionOptions {
  detectImpl?: (text: string) => Promise<{
    signal: AiTextDetectionSignal;
    ai_probability: number | null;
    indicators: string[];
    source_id?: string;
  }>;
  now?: () => string;
}

function normalizeProbability(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
}

export async function detectAiText(
  text: string,
  options: AiTextDetectionOptions = {}
): Promise<VerityResponse<AiTextDetectionAnswer>> {
  const normalized = text.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "AI_TEXT_DETECTION",
      verdict: "rejected",
      confidence: 1,
      answer: { text: "", signal: "indeterminate", ai_probability: null, indicators: [] },
      evidence: [],
      uncertainty: [{ code: "empty_content", message: "Text to analyze is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.detectImpl) {
    return {
      intent: "AI_TEXT_DETECTION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { text: normalized, signal: "indeterminate", ai_probability: null, indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "ai_detector_unconfigured",
        message: "No AI-text detector is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const detection = await options.detectImpl(normalized);
    const probability = normalizeProbability(detection.ai_probability);
    const sourceId = detection.source_id ?? "ai-text-detector";

    return {
      intent: "AI_TEXT_DETECTION",
      verdict:
        detection.signal === "ai_likely"
          ? "likely"
          : detection.signal === "human_likely"
            ? "confirmed"
            : "insufficient_evidence",
      confidence: probability ?? 0,
      answer: {
        text: normalized,
        signal: detection.signal,
        ai_probability: probability,
        indicators: detection.indicators
      },
      evidence: detection.indicators.map((indicator, index) => normalizeEvidence({
        source_id: sourceId + ":" + index,
        source_type: "ai-text-detection",
        title: "AI-text detection indicator",
        excerpt: indicator,
        retrieved_at: retrievedAt
      })),
      uncertainty:
        detection.signal === "indeterminate"
          ? [{
              code: "ai_detection_indeterminate",
              message: "The configured detector could not produce a reliable AI-text classification."
            }]
          : [{
              code: "detector_is_not_authorship_proof",
              message: "AI-text detection is probabilistic and does not establish authorship or provenance by itself."
            }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "AI_TEXT_DETECTION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { text: normalized, signal: "indeterminate", ai_probability: null, indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "ai_detector_failed",
        message: error instanceof Error ? error.message : "AI-text detection failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
