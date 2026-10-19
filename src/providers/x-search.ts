const X_RECENT_SEARCH_URL = "https://api.x.com/2/tweets/search/recent";
const X_SEARCH_TIMEOUT_MS = 10_000;
const X_SEARCH_MAX_RESPONSE_BYTES = 512 * 1024;
const X_SEARCH_REQUEST_RESULTS = 10;
const X_SEARCH_MAX_RESULTS = 5;

export interface XSearchResult {
  id: string;
  text: string;
  url: string;
  author_username: string | null;
  published_at: string | null;
  source_id: string;
  source_type: "x-recent-search";
}

export interface XSearchOptions {
  bearerToken: string;
  fetchImpl?: typeof fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function readJsonLimited(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("X search provider returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > X_SEARCH_MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("X search provider response exceeded the configured limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString("utf8"));
}

export async function xRecentSearch(query: string, options: XSearchOptions): Promise<XSearchResult[]> {
  const bearerToken = options.bearerToken.trim();
  if (!bearerToken) throw new Error("twitter_search_not_configured");

  const url = new URL(X_RECENT_SEARCH_URL);
  url.searchParams.set("query", query);
  // X currently requires at least 10 results. The requested response is capped
  // to five records locally; billing is based on the records X returns.
  url.searchParams.set("max_results", String(X_SEARCH_REQUEST_RESULTS));
  url.searchParams.set("sort_order", "relevancy");
  url.searchParams.set("post.fields", "created_at,author_id,text");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username");

  const response = await (options.fetchImpl ?? fetch)(url, {
    method: "GET",
    headers: { accept: "application/json", authorization: `Bearer ${bearerToken}` },
    redirect: "error",
    signal: AbortSignal.timeout(X_SEARCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`X search provider returned HTTP ${response.status}.`);

  const payload: unknown = await readJsonLimited(response);
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error("X search provider returned an invalid response.");
  }

  const usernames = new Map<string, string>();
  if (isRecord(payload.includes) && Array.isArray(payload.includes.users)) {
    for (const user of payload.includes.users) {
      if (!isRecord(user)) continue;
      const id = text(user.id, 32);
      const username = text(user.username, 64);
      if (id && username && /^[A-Za-z0-9_]{1,15}$/.test(username)) usernames.set(id, username);
    }
  }

  return payload.data.slice(0, X_SEARCH_MAX_RESULTS).flatMap((post): XSearchResult[] => {
    if (!isRecord(post)) return [];
    const id = text(post.id, 32);
    const postText = text(post.text, 10_000);
    if (!id || !/^\d{1,19}$/.test(id) || !postText) return [];
    const username = typeof post.author_id === "string" ? usernames.get(post.author_id) ?? null : null;
    const url = username
      ? `https://x.com/${username}/status/${id}`
      : `https://x.com/i/web/status/${id}`;
    return [{
      id,
      text: postText,
      url,
      author_username: username,
      published_at: timestamp(post.created_at),
      source_id: `x-post:${id}`,
      source_type: "x-recent-search"
    }];
  });
}
