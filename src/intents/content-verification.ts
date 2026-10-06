import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type ContentVerificationSignal = "verified" | "mismatch" | "indeterminate";

export interface ContentVerificationAnswer {
  signal: ContentVerificationSignal;
  explanation: string;
}

export interface ContentVerificationOptions {
  verifyImpl?: (content: string) => Promise<{
    signal: ContentVerificationSignal;
    explanation: string;
    evidence: Array<{
      source_id: string;
      source_type: string;
      title: string;
      url?: string | null;
      excerpt?: string | null;
      published_at?: string | null;
    }>;
  }>;
  now?: () => string;
}

export async function contentVerification(
  content: string,
  options: ContentVerificationOptions = {}
): Promise<VerityResponse<ContentVerificationAnswer>> {
  const normalized = content.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "CONTENT_VERIFICATION",
      verdict: "rejected",
      confidence: 1,
      answer: { signal: "indeterminate", explanation: "" },
      evidence: [],
      uncertainty: [{ code: "empty_content", message: "Content to verify is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.verifyImpl) {
    return {
      intent: "CONTENT_VERIFICATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { signal: "indeterminate", explanation: "" },
      evidence: [],
      uncertainty: [{
        code: "content_verifier_unconfigured",
        message: "No content verification source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const result = await options.verifyImpl(normalized);
    const evidence = result.evidence.map((item) => normalizeEvidence({
      source_id: item.source_id,
      source_type: item.source_type,
      title: item.title,
      url: item.url ?? null,
      excerpt: item.excerpt ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    const abstained = result.signal === "indeterminate" || evidence.length === 0;

    return {
      intent: "CONTENT_VERIFICATION",
      verdict: abstained
        ? "insufficient_evidence"
        : result.signal === "verified"
          ? "confirmed"
          : "likely",
      confidence: abstained ? 0 : Math.min(1, 0.7 + Math.min(evidence.length, 3) * 0.1),
      answer: {
        signal: result.signal,
        explanation: result.explanation
      },
      evidence,
      uncertainty: abstained
        ? [{
            code: result.signal === "indeterminate"
              ? "verification_indeterminate"
              : "no_verification_evidence",
            message: result.signal === "indeterminate"
              ? "The verifier could not establish a reliable result."
              : "A verification result without supporting evidence is not sufficient for a confident conclusion."
          }]
        : [{
            code: "verification_scope_limited",
            message: "Verification applies only to the supplied content and evidence used by the configured verifier."
          }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "CONTENT_VERIFICATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { signal: "indeterminate", explanation: "" },
      evidence: [],
      uncertainty: [{
        code: "content_verifier_failed",
        message: error instanceof Error ? error.message : "Content verification failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
