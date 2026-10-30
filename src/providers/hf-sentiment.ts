const MODEL_ID = "cardiffnlp/twitter-roberta-base-sentiment-latest";
const INFERENCE_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;
const INFERENCE_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 64 * 1024;

export type SentimentLabel = "negative" | "neutral" | "positive";

export interface SentimentScore {
  label: SentimentLabel;
  score: number;
}

export interface HuggingFaceSentimentOptions {
  token: string;
  fetchImpl?: typeof fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readJsonLimited(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("Sentiment provider returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("Sentiment provider response exceeded the configured limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString("utf8"));
}

function parseScores(payload: unknown): SentimentScore[] {
  let records: unknown = payload;
  if (Array.isArray(records) && records.length === 1 && Array.isArray(records[0])) records = records[0];
  if (!Array.isArray(records) || records.length !== 3) throw new Error("Sentiment provider returned invalid scores.");

  const scores = records.map((item): SentimentScore | null => {
    if (!isRecord(item) || typeof item.label !== "string" ||
        !["negative", "neutral", "positive"].includes(item.label.toLowerCase()) ||
        typeof item.score !== "number" || !Number.isFinite(item.score) || item.score < 0 || item.score > 1) return null;
    return { label: item.label.toLowerCase() as SentimentLabel, score: item.score };
  });
  if (scores.some(score => score === null)) throw new Error("Sentiment provider returned invalid scores.");
  const normalized = scores as SentimentScore[];
  if (new Set(normalized.map(item => item.label)).size !== 3) throw new Error("Sentiment provider omitted a class.");
  const total = normalized.reduce((sum, item) => sum + item.score, 0);
  if (Math.abs(total - 1) > 0.02) throw new Error("Sentiment provider scores were not normalized.");
  return normalized.sort((a, b) => b.score - a.score);
}

export async function classifySentiment(text: string, options: HuggingFaceSentimentOptions): Promise<SentimentScore[]> {
  const token = options.token.trim();
  if (!token) throw new Error("sentiment_provider_not_configured");
  const response = await (options.fetchImpl ?? fetch)(INFERENCE_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ inputs: text, parameters: { function_to_apply: "softmax", top_k: 3 } }),
    redirect: "error",
    signal: AbortSignal.timeout(INFERENCE_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Sentiment provider returned HTTP ${response.status}.`);
  return parseScores(await readJsonLimited(response));
}
