import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface ResearchQueryAnswer {
  query: string;
  results: Array<{
    title: string;
    url: string;
    excerpt: string | null;
    source_id: string;
  }>;
}

export interface ResearchQueryOptions {
  searchImpl?: (query: string) => Promise<Array<{
    title: string;
    url: string;
    excerpt?: string | null;
    source_id: string;
    source_type?: string;
    published_at?: string | null;
  }>>;
  now?: () => string;
  max_results?: number;
}

export async function researchQuery(
  query: string,
  options: ResearchQueryOptions = {}
): Promise<VerityResponse<ResearchQueryAnswer>> {
  const normalized = query.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "RESEARCH_QUERY",
      verdict: "rejected",
      confidence: 1,
      answer: { query: "", results: [] },
      evidence: [],
      uncertainty: [{ code: "empty_query", message: "A research query is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.searchImpl) {
    return {
      intent: "RESEARCH_QUERY",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { query: normalized, results: [] },
      evidence: [],
      uncertainty: [{
        code: "research_source_unconfigured",
        message: "No research search source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const raw = await options.searchImpl(normalized);
    const limit = Math.max(1, Math.floor(options.max_results ?? 10));
    const selected = raw.slice(0, limit);

    const evidence = selected.map((item) => normalizeEvidence({
      source_id: item.source_id,
      source_type: item.source_type ?? "research-search",
      title: item.title,
      url: item.url,
      excerpt: item.excerpt ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    return {
      intent: "RESEARCH_QUERY",
      verdict: selected.length > 0 ? "confirmed" : "insufficient_evidence",
      confidence: selected.length > 0 ? Math.min(1, 0.5 + selected.length * 0.05) : 0,
      answer: {
        query: normalized,
        results: selected.map((item) => ({
          title: item.title,
          url: item.url,
          excerpt: item.excerpt ?? null,
          source_id: item.source_id
        }))
      },
      evidence,
      uncertainty: selected.length > 0 ? [] : [{
        code: "no_results",
        message: "The configured research source returned no results."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "RESEARCH_QUERY",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { query: normalized, results: [] },
      evidence: [],
      uncertainty: [{
        code: "research_search_failed",
        message: error instanceof Error ? error.message : "Research search failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
