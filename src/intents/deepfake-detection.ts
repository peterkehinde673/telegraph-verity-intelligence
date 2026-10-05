import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type DeepfakeSignal = "manipulated_likely" | "authentic_likely" | "indeterminate";

export interface DeepfakeDetectionAnswer {
  media_type: "image" | "video" | "audio" | "unknown";
  signal: DeepfakeSignal;
  manipulation_probability: number | null;
  indicators: string[];
}

export interface DeepfakeDetectionOptions {
  detectImpl?: (input: string) => Promise<{
    media_type: "image" | "video" | "audio" | "unknown";
    signal: DeepfakeSignal;
    manipulation_probability: number | null;
    indicators: string[];
    source_id?: string;
  }>;
  now?: () => string;
}

function normalizeProbability(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
}

export async function detectDeepfake(
  input: string,
  options: DeepfakeDetectionOptions = {}
): Promise<VerityResponse<DeepfakeDetectionAnswer>> {
  const normalized = input.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "DEEPFAKE_DETECTION",
      verdict: "rejected",
      confidence: 1,
      answer: {
        media_type: "unknown",
        signal: "indeterminate",
        manipulation_probability: null,
        indicators: []
      },
      evidence: [],
      uncertainty: [{ code: "empty_input", message: "A media reference is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.detectImpl) {
    return {
      intent: "DEEPFAKE_DETECTION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: {
        media_type: "unknown",
        signal: "indeterminate",
        manipulation_probability: null,
        indicators: []
      },
      evidence: [],
      uncertainty: [{
        code: "deepfake_detector_unconfigured",
        message: "No deepfake detector is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const detection = await options.detectImpl(normalized);
    const probability = normalizeProbability(detection.manipulation_probability);
    const sourceId = detection.source_id ?? "deepfake-detector";

    return {
      intent: "DEEPFAKE_DETECTION",
      verdict:
        detection.signal === "manipulated_likely"
          ? "likely"
          : detection.signal === "authentic_likely"
            ? "confirmed"
            : "insufficient_evidence",
      confidence: probability ?? 0,
      answer: {
        media_type: detection.media_type,
        signal: detection.signal,
        manipulation_probability: probability,
        indicators: detection.indicators
      },
      evidence: detection.indicators.map((indicator, index) => normalizeEvidence({
        source_id: sourceId + ":" + index,
        source_type: "deepfake-detection",
        title: "Media manipulation indicator",
        excerpt: indicator,
        retrieved_at: retrievedAt
      })),
      uncertainty: [{
        code: "deepfake_detection_is_probabilistic",
        message: "Deepfake detection is probabilistic and should not be treated as proof of authenticity or manipulation on its own."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "DEEPFAKE_DETECTION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: {
        media_type: "unknown",
        signal: "indeterminate",
        manipulation_probability: null,
        indicators: []
      },
      evidence: [],
      uncertainty: [{
        code: "deepfake_detector_failed",
        message: error instanceof Error ? error.message : "Deepfake detection failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
