import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type VideoVerificationSignal = "verified" | "mismatch" | "indeterminate";

export interface VideoVerificationAnswer {
  signal: VideoVerificationSignal;
  indicators: string[];
}

export interface VideoVerificationOptions {
  verifyImpl?: (input: string) => Promise<{
    signal: VideoVerificationSignal;
    indicators: string[];
    source_id?: string;
  }>;
  now?: () => string;
}

export async function verifyVideo(
  input: string,
  options: VideoVerificationOptions = {}
): Promise<VerityResponse<VideoVerificationAnswer>> {
  const normalized = input.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "VIDEO_VERIFICATION",
      verdict: "rejected",
      confidence: 1,
      answer: { signal: "indeterminate", indicators: [] },
      evidence: [],
      uncertainty: [{ code: "empty_input", message: "A video reference is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.verifyImpl) {
    return {
      intent: "VIDEO_VERIFICATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { signal: "indeterminate", indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "video_verifier_unconfigured",
        message: "No video-verification source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const verification = await options.verifyImpl(normalized);
    const sourceId = verification.source_id ?? "video-verifier";

    return {
      intent: "VIDEO_VERIFICATION",
      verdict:
        verification.signal === "verified"
          ? "confirmed"
          : verification.signal === "mismatch"
            ? "likely"
            : "insufficient_evidence",
      confidence: verification.signal === "indeterminate" ? 0 : 1,
      answer: {
        signal: verification.signal,
        indicators: verification.indicators
      },
      evidence: verification.indicators.map((indicator, index) => normalizeEvidence({
        source_id: sourceId + ":" + index,
        source_type: "video-verification",
        title: "Video verification indicator",
        excerpt: indicator,
        retrieved_at: retrievedAt
      })),
      uncertainty: verification.signal === "indeterminate"
        ? [{
            code: "video_verification_indeterminate",
            message: "The configured verifier could not establish a reliable verification result."
          }]
        : [{
            code: "verification_scope_limited",
            message: "A verification result only supports the specific evidence and verification method used; it is not universal proof of video provenance."
          }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "VIDEO_VERIFICATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { signal: "indeterminate", indicators: [] },
      evidence: [],
      uncertainty: [{
        code: "video_verifier_failed",
        message: error instanceof Error ? error.message : "Video verification failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
