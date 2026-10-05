import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface NewsHeadline {
  title: string;
  url: string;
  source_id: string;
  published_at: string | null;
}

export interface NewsHeadlinesAnswer {
  topic: string;
  headlines: NewsHeadline[];
}

export interface NewsHeadlinesOptions {
  fetchImpl?: (topic: string) => Promise<Array<{
    title: string;
    url: string;
    source_id: string;
    source_type?: string;
    published_at?: string | null;
    excerpt?: string | null;
  }>>;
  now?: () => string;
  max_results?: number;
}

export async function newsHeadlines(
  topic: string,
  options: NewsHeadlinesOptions = {}
): Promise<VerityResponse<NewsHeadlinesAnswer>> {
  const normalized = topic.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalized) {
    return {
      intent: "NEWS_HEADLINES",
      verdict: "rejected",
      confidence: 1,
      answer: { topic: "", headlines: [] },
      evidence: [],
      uncertainty: [{ code: "empty_topic", message: "A news topic is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.fetchImpl) {
    return {
      intent: "NEWS_HEADLINES",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { topic: normalized, headlines: [] },
      evidence: [],
      uncertainty: [{
        code: "news_source_unconfigured",
        message: "No news source is configured for this deployment."
      }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const raw = await options.fetchImpl(normalized);
    const limit = Math.max(1, Math.floor(options.max_results ?? 10));
    const selected = raw.slice(0, limit);

    const evidence = selected.map((item) => normalizeEvidence({
      source_id: item.source_id,
      source_type: item.source_type ?? "news",
      title: item.title,
      url: item.url,
      excerpt: item.excerpt ?? null,
      published_at: item.published_at ?? null,
      retrieved_at: retrievedAt
    }));

    return {
      intent: "NEWS_HEADLINES",
      verdict: selected.length > 0 ? "confirmed" : "insufficient_evidence",
      confidence: selected.length > 0 ? Math.min(1, 0.5 + selected.length * 0.05) : 0,
      answer: {
        topic: normalized,
        headlines: selected.map((item) => ({
          title: item.title,
          url: item.url,
          source_id: item.source_id,
          published_at: item.published_at ?? null
        }))
      },
      evidence,
      uncertainty: selected.length > 0 ? [] : [{
        code: "no_headlines",
        message: "The configured news source returned no headlines for this topic."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "NEWS_HEADLINES",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { topic: normalized, headlines: [] },
      evidence: [],
      uncertainty: [{
        code: "news_fetch_failed",
        message: error instanceof Error ? error.message : "News retrieval failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
