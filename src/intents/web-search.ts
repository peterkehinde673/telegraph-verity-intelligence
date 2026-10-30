import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";
import { jinaWebSearch, type JinaSearchResult } from "../providers/jina-search.js";

const MAX_QUERY_LENGTH = 500;
const MAX_RESULTS = 10;

export interface WebSearchAnswer {
  query: string;
  results: Array<{
    title: string;
    url: string;
    excerpt: string | null;
    source_id: string;
    published_at: string | null;
  }>;
}

export interface WebSearchOptions {
  apiKey?: string;
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

function isValidResult(value: unknown): value is JinaSearchResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  if (typeof result.title !== "string" || !result.title.trim() ||
      result.title.length > 500 ||
      typeof result.url !== "string" || result.url.length > 2048 ||
      typeof result.source_id !== "string" || !result.source_id.trim() || result.source_id.length > 4096 ||
      (result.excerpt !== undefined && result.excerpt !== null &&
        (typeof result.excerpt !== "string" || result.excerpt.length > 4000)) ||
      (result.published_at !== undefined && result.published_at !== null &&
        (typeof result.published_at !== "string" || Number.isNaN(Date.parse(result.published_at)))) ||
      (result.source_type !== undefined && typeof result.source_type !== "string")) {
    return false;
  }

  try {
    const url = new URL(result.url);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

function emptyResponse(
  query: string,
  retrievedAt: string,
  code: string,
  message: string
): VerityResponse<WebSearchAnswer> {
  return {
    intent: "WEB_SEARCH",
    verdict: "insufficient_evidence",
    confidence: 0,
    answer: { query, results: [] },
    evidence: [],
    uncertainty: [{ code, message }],
    retrieved_at: retrievedAt
  };
}

export async function webSearch(
  query: unknown,
  options: WebSearchOptions = {}
): Promise<VerityResponse<WebSearchAnswer>> {
  const normalized = typeof query === "string" ? query.trim() : "";
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const emptyAnswer = (value: string) => ({ query: value, results: [] });

  if (!normalized) {
    return {
      intent: "WEB_SEARCH",
      verdict: "rejected",
      confidence: 1,
      answer: emptyAnswer(""),
      evidence: [],
      uncertainty: [{
        code: typeof query === "string" ? "empty_query" : "invalid_query",
        message: typeof query === "string" ? "A web search query is required." : "The web search query must be a string."
      }],
      retrieved_at: retrievedAt
    };
  }

  if (normalized.length > MAX_QUERY_LENGTH) {
    return {
      intent: "WEB_SEARCH",
      verdict: "rejected",
      confidence: 1,
      answer: emptyAnswer(normalized.slice(0, MAX_QUERY_LENGTH)),
      evidence: [],
      uncertainty: [{
        code: "query_too_long",
        message: `A web search query must be ${MAX_QUERY_LENGTH} characters or fewer.`
      }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.searchImpl && !options.apiKey?.trim()) {
    return emptyResponse(
      normalized,
      retrievedAt,
      "web_search_source_unconfigured",
      "A Jina Search API key is required to search the web in this deployment."
    );
  }

  try {
    const raw = options.searchImpl
      ? await options.searchImpl(normalized)
      : await jinaWebSearch(normalized, { apiKey: options.apiKey! });
    const configuredLimit = options.max_results ?? 5;
    const limit = Number.isFinite(configuredLimit)
      ? Math.min(MAX_RESULTS, Math.max(1, Math.floor(configuredLimit)))
      : 5;
    const selected = raw.filter(isValidResult).slice(0, limit);
    const evidence = selected.map((item) => normalizeEvidence({
      source_id: item.source_id,
      source_type: item.source_type ?? "web-search",
      title: item.title,
      url: item.url,
      excerpt: item.excerpt ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    return {
      intent: "WEB_SEARCH",
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
      uncertainty: selected.length > 0 ? [{
        code: "search_results_are_not_verification",
        message: "These are attributable web search results, not independent verification of the pages' claims."
      }] : [{
        code: "no_web_results",
        message: "The configured web search source returned no valid results for this query."
      }],
      retrieved_at: retrievedAt
    };
  } catch {
    return emptyResponse(
      normalized,
      retrievedAt,
      "web_search_failed",
      "The configured web search source could not be reached or returned an invalid response."
    );
  }
}
