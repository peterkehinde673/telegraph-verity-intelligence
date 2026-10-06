import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface AcademicResult {
  title: string;
  url: string;
  source_id: string;
  authors: string[];
  published_at: string | null;
  abstract: string | null;
}

export interface AcademicSearchAnswer {
  query: string;
  results: AcademicResult[];
}

export interface AcademicSearchOptions {
  searchImpl?: (query: string) => Promise<Array<{
    title: string;
    url: string;
    source_id: string;
    authors?: string[];
    published_at?: string | null;
    abstract?: string | null;
    source_type?: string;
  }>>;
  now?: () => string;
  max_results?: number;
}

export async function academicSearch(
  query: string,
  options: AcademicSearchOptions = {}
): Promise<VerityResponse<AcademicSearchAnswer>> {
  const normalized = query.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "ACADEMIC_SEARCH",
      verdict: "rejected",
      confidence: 1,
      answer: { query: "", results: [] },
      evidence: [],
      uncertainty: [{ code: "empty_query", message: "An academic search query is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.searchImpl) {
    return {
      intent: "ACADEMIC_SEARCH",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { query: normalized, results: [] },
      evidence: [],
      uncertainty: [{
        code: "academic_source_unconfigured",
        message: "No academic search source is configured for this deployment."
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
      source_type: item.source_type ?? "academic",
      title: item.title,
      url: item.url,
      excerpt: item.abstract ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    return {
      intent: "ACADEMIC_SEARCH",
      verdict: selected.length > 0 ? "confirmed" : "insufficient_evidence",
      confidence: selected.length > 0 ? Math.min(1, 0.5 + selected.length * 0.05) : 0,
      answer: {
        query: normalized,
        results: selected.map((item) => ({
          title: item.title,
          url: item.url,
          source_id: item.source_id,
          authors: item.authors ?? [],
          published_at: item.published_at ?? null,
          abstract: item.abstract ?? null
        }))
      },
      evidence,
      uncertainty: selected.length > 0 ? [] : [{
        code: "no_academic_results",
        message: "The configured academic source returned no results."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "ACADEMIC_SEARCH",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { query: normalized, results: [] },
      evidence: [],
      uncertainty: [{
        code: "academic_search_failed",
        message: error instanceof Error ? error.message : "Academic search failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
