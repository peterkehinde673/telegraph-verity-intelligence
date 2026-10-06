const WIKIMEDIA_SEARCH = "https://en.wikipedia.org/w/rest.php/v1/search/page";
const CROSSREF_WORKS = "https://api.crossref.org/v1/works";
const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Telegraph-Verity-Intelligence/0.1"
    },
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
  return response.json();
}

export async function wikipediaSearch(query: string) {
  const url = new URL(WIKIMEDIA_SEARCH);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");

  const data = await fetchJson(url) as {
    pages?: Array<{ id?: number; key?: string; title?: string; description?: string; excerpt?: string }>;
  };

  return (data.pages ?? []).map((page) => {
    const key = page.key ?? page.title ?? "";
    return {
      title: clean(page.title) ?? key,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(key.replace(/ /g, "_"))}`,
      excerpt: clean(page.description ?? page.excerpt),
      source_id: `wikipedia:${page.id ?? key}`,
      source_type: "wikipedia"
    };
  });
}

export async function crossrefSearch(query: string) {
  const url = new URL(CROSSREF_WORKS);
  url.searchParams.set("query.bibliographic", query);
  url.searchParams.set("rows", "10");

  const data = await fetchJson(url) as {
    message?: { items?: Array<{
      DOI?: string;
      title?: string[];
      URL?: string;
      abstract?: string;
      author?: Array<{ given?: string; family?: string }>;
      published?: { "date-parts"?: number[][] };
    }> };
  };

  return (data.message?.items ?? []).map((item) => {
    const date = item.published?.["date-parts"]?.[0];
    const year = date?.[0];
    const month = date?.[1] ?? 1;
    const day = date?.[2] ?? 1;
    return {
      title: clean(item.title?.[0]) ?? "Untitled work",
      url: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : ""),
      source_id: item.DOI ? `doi:${item.DOI}` : `crossref:${item.URL ?? "unknown"}`,
      authors: (item.author ?? []).map((author) => [author.given, author.family].filter(Boolean).join(" ")),
      published_at: typeof year === "number" && Number.isInteger(year)
        ? new Date(Date.UTC(year, month - 1, day)).toISOString()
        : null,
      abstract: clean(item.abstract),
      source_type: "crossref"
    };
  }).filter((item) => item.url);
}

function xmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

export async function googleNewsRss(topic: string) {
  const url = new URL(GOOGLE_NEWS_RSS);
  url.searchParams.set("q", topic);

  const response = await fetch(url, {
    headers: { accept: "application/rss+xml, application/xml", "user-agent": "Telegraph-Verity-Intelligence/0.1" },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`News provider returned HTTP ${response.status}.`);

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);

  return items.map((match) => {
    const item = match[1] ?? "";
    const title = clean(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const link = clean(item.match(/<link>([\s\S]*?)<\/link>/)?.[1]);
    const pubDate = clean(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]);
    return {
      title: title ? xmlEntities(title) : "Untitled headline",
      url: link ? xmlEntities(link) : "",
      source_id: `google-news:${link ?? title ?? "unknown"}`,
      published_at: pubDate ? new Date(pubDate).toISOString() : null,
      source_type: "news-rss"
    };
  }).filter((item) => item.url);
}
