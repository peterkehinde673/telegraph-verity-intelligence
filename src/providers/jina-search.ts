const JINA_SEARCH_URL = "https://s.jina.ai/";
const JINA_SEARCH_TIMEOUT_MS = 10_000;
const JINA_SEARCH_MAX_RESPONSE_BYTES = 512 * 1024;
const JINA_SEARCH_MAX_RESULTS = 10;

export interface JinaSearchResult {
  title: string;
  url: string;
  excerpt: string | null;
  published_at: string | null;
  source_id: string;
  source_type: "jina-web-search";
}

export interface JinaSearchOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
}

function clean(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readJsonLimited(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("Web search provider returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > JINA_SEARCH_MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("Web search provider response exceeded the configured limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const payload = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
  return JSON.parse(payload);
}

export async function jinaWebSearch(
  query: string,
  options: JinaSearchOptions
): Promise<JinaSearchResult[]> {
  const apiKey = options.apiKey.trim();
  if (!apiKey) throw new Error("web_search_not_configured");

  const url = new URL(JINA_SEARCH_URL);
  url.searchParams.set("q", query);

  const response = await (options.fetchImpl ?? fetch)(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
      "x-respond-with": "no-content"
    },
    signal: AbortSignal.timeout(JINA_SEARCH_TIMEOUT_MS)
  });

  if (!response.ok) throw new Error(`Web search provider returned HTTP ${response.status}.`);

  const payload: unknown = await readJsonLimited(response);
  if (!isRecord(payload) || payload.code !== 200 || !Array.isArray(payload.data)) {
    throw new Error("Web search provider returned an invalid response.");
  }

  return payload.data.slice(0, JINA_SEARCH_MAX_RESULTS).flatMap((entry): JinaSearchResult[] => {
    if (!isRecord(entry)) return [];
    const title = clean(entry.title, 500);
    const sourceUrl = clean(entry.url, 2048);
    if (!title || !sourceUrl || !validHttpUrl(sourceUrl)) return [];

    return [{
      title,
      url: sourceUrl,
      excerpt: clean(entry.description, 4000),
      published_at: timestamp(entry.publishedTime),
      source_id: `jina-search:${sourceUrl}`,
      source_type: "jina-web-search"
    }];
  });
}
