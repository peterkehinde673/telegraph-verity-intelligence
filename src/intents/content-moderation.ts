import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type ModerationCategory =
  | "hate"
  | "harassment"
  | "violence"
  | "sexual"
  | "self_harm"
  | "illegal_activity"
  | "spam"
  | "benign";

export interface ModerationFinding {
  category: ModerationCategory;
  score: number;
  rationale: string;
}

export interface ContentModerationAnswer {
  text: string;
  flagged: boolean;
  findings: ModerationFinding[];
}

export interface ContentModerationOptions {
  classifyImpl?: (text: string) => Promise<ModerationFinding[]>;
  now?: () => string;
}

function clampScore(score: number): number {
  return Math.min(1, Math.max(0, score));
}

export async function moderateContent(
  text: string,
  options: ContentModerationOptions = {}
): Promise<VerityResponse<ContentModerationAnswer>> {
  const normalized = text.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "CONTENT_MODERATION",
      verdict: "rejected",
      confidence: 1,
      answer: { text: "", flagged: false, findings: [] },
      evidence: [],
      uncertainty: [{
        code: "empty_content",
        message: "Content to moderate is required."
      }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.classifyImpl) {
    return {
      intent: "CONTENT_MODERATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { text: normalized, flagged: false, findings: [] },
      evidence: [],
      uncertainty: [{
        code: "moderation_source_unconfigured",
        message: "No moderation classifier is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const rawFindings = await options.classifyImpl(normalized);
    const findings = rawFindings.map((finding) => ({
      ...finding,
      score: clampScore(finding.score)
    }));
    const flagged = findings.some((finding) => finding.category !== "benign" && finding.score >= 0.5);
    const highestScore = findings.reduce((highest, finding) => Math.max(highest, finding.score), 0);

    return {
      intent: "CONTENT_MODERATION",
      verdict: flagged ? "confirmed" : "not_found",
      confidence: highestScore,
      answer: {
        text: normalized,
        flagged,
        findings
      },
      evidence: findings.map((finding, index) => normalizeEvidence({
        source_id: "moderation:classifier:" + index,
        source_type: "content-moderation",
        title: finding.category + " classification",
        excerpt: finding.rationale,
        retrieved_at: retrievedAt
      })),
      uncertainty: flagged ? [] : [{
        code: "no_flagged_category",
        message: "The configured classifier did not identify content above the moderation threshold."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "CONTENT_MODERATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { text: normalized, flagged: false, findings: [] },
      evidence: [],
      uncertainty: [{
        code: "moderation_lookup_failed",
        message: error instanceof Error ? error.message : "Content moderation failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
