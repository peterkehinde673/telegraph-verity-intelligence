import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface NewsSearchResult {
  title: string;
  url: string;
  excerpt: string | null;
  source_id: string;
  published_at: string | null;
}

export interface NewsSearchAnswer {
  query: string;
  results: NewsSearchResult[];
}

export interface NewsSearchOptions {
  searchImpl?: (query: string) => Promise<Array<{
    title: string;
    url: string;
    source_id: string;
    source_type?: string;
    excerpt?: string | null;
    published_at?: string | null;
  }>>;
  now?: () => string;
  max_results?: number;
}

export async function newsSearch(
  query: string,
  options: NewsSearchOptions = {}
): Promise<VerityResponse<NewsSearchAnswer>> {
  const normalized = query.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const emptyAnswer = (value: string): NewsSearchAnswer => ({ query: value, results: [] });

  if (!normalized) {
    return {
      intent: "NEWS_SEARCH",
      verdict: "rejected",
      confidence: 1,
      answer: emptyAnswer(""),
      evidence: [],
      uncertainty: [{ code: "empty_query", message: "A news search query is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.searchImpl) {
    return {
      intent: "NEWS_SEARCH",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: emptyAnswer(normalized),
      evidence: [],
      uncertainty: [{ code: "news_source_unconfigured", message: "No news search source is configured for this deployment." }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const raw = await options.searchImpl(normalized);
    const configuredLimit = options.max_results ?? 10;
    const limit = Number.isFinite(configuredLimit) ? Math.min(50, Math.max(1, Math.floor(configuredLimit))) : 10;
    const selected = raw.filter((item) =>
      typeof item.title === "string" && item.title.trim() !== "" &&
      typeof item.url === "string" && /^https?:\/\//i.test(item.url) &&
      typeof item.source_id === "string" && item.source_id.trim() !== ""
    ).slice(0, limit);

    const evidence = selected.map((item) => normalizeEvidence({
      source_id: item.source_id,
      source_type: item.source_type ?? "news-search",
      title: item.title,
      url: item.url,
      excerpt: item.excerpt ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    return {
      intent: "NEWS_SEARCH",
      verdict: selected.length > 0 ? "confirmed" : "insufficient_evidence",
      confidence: selected.length > 0 ? Math.min(1, 0.5 + selected.length * 0.05) : 0,
      answer: {
        query: normalized,
        results: selected.map((item) => ({
          title: item.title,
          url: item.url,
          excerpt: item.excerpt ?? null,
          source_id: item.source_id,
          published_at: item.published_at ?? null
        }))
      },
      evidence,
      uncertainty: selected.length > 0 ? [] : [{
        code: "no_news_results",
        message: "The configured news source returned no valid results for this query."
      }],
      retrieved_at: retrievedAt
    };
  } catch {
    return {
      intent: "NEWS_SEARCH",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: emptyAnswer(normalized),
      evidence: [],
      uncertainty: [{
        code: "news_search_failed",
        message: "The configured news source could not be reached or returned an invalid response."
      }],
      retrieved_at: retrievedAt
    };
  }
}
