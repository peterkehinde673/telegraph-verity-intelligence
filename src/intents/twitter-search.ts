import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";
import { xRecentSearch, type XSearchResult } from "../providers/x-search.js";

const MAX_QUERY_LENGTH = 500;
const MAX_RESULTS = 5;

export interface TwitterSearchAnswer {
  query: string;
  results: Array<{
    id: string;
    text: string;
    url: string;
    author_username: string | null;
    published_at: string | null;
    source_id: string;
  }>;
}

export interface TwitterSearchOptions {
  bearerToken?: string;
  searchImpl?: (query: string) => Promise<XSearchResult[]>;
  now?: () => string;
}

function validResult(value: unknown): value is XSearchResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  if (typeof result.id !== "string" || !/^\d{1,19}$/.test(result.id) ||
      typeof result.text !== "string" || !result.text.trim() || result.text.length > 10_000 ||
      typeof result.url !== "string" || result.url.length > 2048 ||
      typeof result.source_id !== "string" || result.source_id !== `x-post:${result.id}` ||
      (result.author_username !== null && result.author_username !== undefined &&
        (typeof result.author_username !== "string" || !/^[A-Za-z0-9_]{1,15}$/.test(result.author_username))) ||
      (result.published_at !== null && result.published_at !== undefined &&
        (typeof result.published_at !== "string" || Number.isNaN(Date.parse(result.published_at))))) return false;
  try {
    const url = new URL(result.url);
    return url.protocol === "https:" && url.hostname === "x.com" &&
      (url.pathname === `/i/web/status/${result.id}` ||
       url.pathname === `/${result.author_username}/status/${result.id}`);
  } catch {
    return false;
  }
}

function abstain(query: string, retrievedAt: string, code: string, message: string): VerityResponse<TwitterSearchAnswer> {
  return {
    intent: "TWITTER_SEARCH",
    verdict: "insufficient_evidence",
    confidence: 0,
    answer: { query, results: [] },
    evidence: [],
    uncertainty: [{ code, message }],
    retrieved_at: retrievedAt
  };
}

export async function twitterSearch(query: unknown, options: TwitterSearchOptions = {}): Promise<VerityResponse<TwitterSearchAnswer>> {
  const normalized = typeof query === "string" ? query.trim() : "";
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const empty = (value: string): TwitterSearchAnswer => ({ query: value, results: [] });
  if (!normalized) {
    return {
      intent: "TWITTER_SEARCH", verdict: "rejected", confidence: 1, answer: empty(""), evidence: [],
      uncertainty: [{ code: typeof query === "string" ? "empty_query" : "invalid_query", message: "A platform search query string is required." }],
      retrieved_at: retrievedAt
    };
  }
  if (normalized.length > MAX_QUERY_LENGTH) {
    return {
      intent: "TWITTER_SEARCH", verdict: "rejected", confidence: 1,
      answer: empty(normalized.slice(0, MAX_QUERY_LENGTH)), evidence: [],
      uncertainty: [{ code: "query_too_long", message: `A platform search query must be ${MAX_QUERY_LENGTH} characters or fewer.` }],
      retrieved_at: retrievedAt
    };
  }
  if (!options.searchImpl && !options.bearerToken?.trim()) {
    return abstain(normalized, retrievedAt, "twitter_search_source_unconfigured", "An X API bearer token is required to search public X posts in this deployment.");
  }

  try {
    const raw = options.searchImpl
      ? await options.searchImpl(normalized)
      : await xRecentSearch(normalized, { bearerToken: options.bearerToken! });
    if (!Array.isArray(raw)) throw new Error("invalid_search_results");
    const selected = raw.filter(validResult).slice(0, MAX_RESULTS);
    const evidence = selected.map(post => normalizeEvidence({
      source_id: post.source_id,
      source_type: post.source_type,
      title: post.author_username ? `Post by @${post.author_username}` : "Public X post",
      url: post.url,
      excerpt: post.text,
      published_at: post.published_at,
      retrieved_at: retrievedAt
    }));
    return {
      intent: "TWITTER_SEARCH",
      verdict: selected.length ? "confirmed" : "insufficient_evidence",
      confidence: selected.length ? Math.min(1, 0.5 + selected.length * 0.05) : 0,
      answer: { query: normalized, results: selected },
      evidence,
      uncertainty: selected.length ? [{
        code: "recent_platform_search_only",
        message: "Results cover X's recent search window and do not establish whether posts or their claims are true."
      }] : [{ code: "no_twitter_results", message: "X returned no valid public posts for this query." }],
      retrieved_at: retrievedAt
    };
  } catch {
    return abstain(normalized, retrievedAt, "twitter_search_failed", "The configured X search source could not be reached or returned an invalid response.");
  }
}
