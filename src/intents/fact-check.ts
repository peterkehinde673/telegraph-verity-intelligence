import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type FactCheckVerdict = "true" | "false" | "mixed" | "unverified";

export interface FactCheckAnswer {
  claim: string;
  verdict: FactCheckVerdict;
  explanation: string;
}

export interface FactCheckOptions {
  checkImpl?: (claim: string) => Promise<{
    verdict: FactCheckVerdict;
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

function confidenceFor(verdict: FactCheckVerdict, evidenceCount: number): number {
  if (verdict === "unverified") return 0;
  if (evidenceCount === 0) return 0;
  return Math.min(1, 0.6 + evidenceCount * 0.1);
}

export async function factCheck(
  claim: string,
  options: FactCheckOptions = {}
): Promise<VerityResponse<FactCheckAnswer>> {
  const normalized = claim.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "FACT_CHECK",
      verdict: "rejected",
      confidence: 1,
      answer: { claim: "", verdict: "unverified", explanation: "" },
      evidence: [],
      uncertainty: [{ code: "empty_claim", message: "A claim to fact-check is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.checkImpl) {
    return {
      intent: "FACT_CHECK",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { claim: normalized, verdict: "unverified", explanation: "" },
      evidence: [],
      uncertainty: [{
        code: "fact_checker_unconfigured",
        message: "No fact-checking source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const result = await options.checkImpl(normalized);
    const evidence = result.evidence.map((item) => normalizeEvidence({
      source_id: item.source_id,
      source_type: item.source_type,
      title: item.title,
      url: item.url ?? null,
      excerpt: item.excerpt ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    return {
      intent: "FACT_CHECK",
      verdict: result.verdict === "unverified" ? "insufficient_evidence" : "confirmed",
      confidence: confidenceFor(result.verdict, evidence.length),
      answer: {
        claim: normalized,
        verdict: result.verdict,
        explanation: result.explanation
      },
      evidence,
      uncertainty: result.verdict === "unverified"
        ? [{
            code: "claim_unverified",
            message: "Available evidence was insufficient to establish the claim as true, false, or mixed."
          }]
        : [],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "FACT_CHECK",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { claim: normalized, verdict: "unverified", explanation: "" },
      evidence: [],
      uncertainty: [{
        code: "fact_checker_failed",
        message: error instanceof Error ? error.message : "Fact-checking failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
