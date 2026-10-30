const READER_BASE = "https://r.jina.ai/";

export interface ReaderExtraction {
  content: string;
  content_type: string;
  title?: string | null;
  url: string;
  source_id: string;
}

export async function readUrl(
  source: string,
  apiKey?: string,
  fetchImpl: typeof fetch = fetch
): Promise<ReaderExtraction> {
  const target = new URL(source);
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs can be extracted.");
  }

  const response = await fetchImpl(READER_BASE + target.toString(), {
    headers: {
      accept: "text/plain",
      "user-agent": "telegraph-verity-intelligence/0.1",
      ...(apiKey?.trim() ? { authorization: `Bearer ${apiKey.trim()}` } : {})
    },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error(`Reader request failed with HTTP ${response.status}.`);
  }

  const content = (await response.text()).trim();
  if (!content) throw new Error("Reader returned no content.");

  return {
    content,
    content_type: "text/markdown",
    title: null,
    url: target.toString(),
    source_id: `jina-reader:${target.toString()}`
  };
}
