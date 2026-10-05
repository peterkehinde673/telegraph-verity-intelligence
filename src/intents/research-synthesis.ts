import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface ResearchSynthesisAnswer {
  question: string;
  synthesis: string;
  key_points: string[];
}

export interface ResearchSynthesisOptions {
  synthesizeImpl?: (question: string, evidence: Array<{
    source_id: string;
    title: string;
    excerpt?: string | null;
    url?: string | null;
  }>) => Promise<{
    synthesis: string;
    key_points: string[];
  }>;
  evidence?: Array<{
    source_id: string;
    source_type?: string;
    title: string;
    excerpt?: string | null;
    url?: string | null;
    published_at?: string | null;
  }>;
  now?: () => string;
}

export async function researchSynthesis(
  question: string,
  options: ResearchSynthesisOptions = {}
): Promise<VerityResponse<ResearchSynthesisAnswer>> {
  const normalized = question.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const suppliedEvidence = options.evidence ?? [];

  if (!normalized) {
    return {
      intent: "RESEARCH_SYNTHESIS",
      verdict: "rejected",
      confidence: 1,
      answer: { question: "", synthesis: "", key_points: [] },
      evidence: [],
      uncertainty: [{ code: "empty_question", message: "A research question is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (suppliedEvidence.length === 0) {
    return {
      intent: "RESEARCH_SYNTHESIS",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { question: normalized, synthesis: "", key_points: [] },
      evidence: [],
      uncertainty: [{
        code: "no_source_evidence",
        message: "Synthesis requires at least one supplied evidence source."
      }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.synthesizeImpl) {
    return {
      intent: "RESEARCH_SYNTHESIS",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { question: normalized, synthesis: "", key_points: [] },
      evidence: [],
      uncertainty: [{
        code: "synthesis_source_unconfigured",
        message: "No synthesis implementation is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const synthesis = await options.synthesizeImpl(normalized, suppliedEvidence.map((item) => ({
      source_id: item.source_id,
      title: item.title,
      excerpt: item.excerpt ?? null,
      url: item.url ?? null
    })));

    const evidence = suppliedEvidence.map((item) => normalizeEvidence({
      source_id: item.source_id,
      source_type: item.source_type ?? "research",
      title: item.title,
      url: item.url ?? null,
      excerpt: item.excerpt ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    return {
      intent: "RESEARCH_SYNTHESIS",
      verdict: synthesis.synthesis.trim() ? "confirmed" : "insufficient_evidence",
      confidence: synthesis.synthesis.trim() ? Math.min(1, 0.6 + Math.min(evidence.length, 4) * 0.1) : 0,
      answer: {
        question: normalized,
        synthesis: synthesis.synthesis,
        key_points: synthesis.key_points
      },
      evidence,
      uncertainty: synthesis.synthesis.trim() ? [] : [{
        code: "empty_synthesis",
        message: "The synthesis implementation did not produce a conclusion."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "RESEARCH_SYNTHESIS",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { question: normalized, synthesis: "", key_points: [] },
      evidence: [],
      uncertainty: [{
        code: "synthesis_failed",
        message: error instanceof Error ? error.message : "Research synthesis failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
