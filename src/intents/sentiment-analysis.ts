import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";
import { classifySentiment, type HuggingFaceSentimentOptions, type SentimentScore } from "../providers/hf-sentiment.js";

const MAX_TEXT_LENGTH = 4_000;
const MODEL_ID = "cardiffnlp/twitter-roberta-base-sentiment-latest";
const MODEL_CARD_URL = `https://huggingface.co/${MODEL_ID}`;
const LOW_SCORE_THRESHOLD = 0.55;

export interface SentimentAnswer {
  sentiment: "negative" | "neutral" | "positive";
  model_score: number;
  class_scores: SentimentScore[];
  model: string;
  language_scope: "English";
}

export interface SentimentAnalysisOptions extends Partial<HuggingFaceSentimentOptions> {
  classifyImpl?: (text: string) => Promise<SentimentScore[]>;
  now?: () => string;
}

function insufficient(text: string, retrievedAt: string, code: string, message: string): VerityResponse<Record<string, unknown>> {
  return {
    intent: "SENTIMENT_ANALYSIS",
    verdict: "insufficient_evidence",
    confidence: 0,
    answer: { text, sentiment: null },
    evidence: [],
    uncertainty: [{ code, message }],
    retrieved_at: retrievedAt
  };
}

export async function sentimentAnalysis(input: unknown, options: SentimentAnalysisOptions = {}): Promise<VerityResponse<SentimentAnswer | Record<string, unknown>>> {
  const text = typeof input === "string" ? input.trim() : "";
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  if (!text) {
    return {
      intent: "SENTIMENT_ANALYSIS", verdict: "rejected", confidence: 1,
      answer: { text: "", sentiment: null }, evidence: [],
      uncertainty: [{ code: typeof input === "string" ? "empty_text" : "invalid_text", message: "A non-empty text string is required for sentiment analysis." }],
      retrieved_at: retrievedAt
    };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      intent: "SENTIMENT_ANALYSIS", verdict: "rejected", confidence: 1,
      answer: { text: text.slice(0, MAX_TEXT_LENGTH), sentiment: null }, evidence: [],
      uncertainty: [{ code: "text_too_long", message: `Sentiment analysis accepts at most ${MAX_TEXT_LENGTH} characters.` }],
      retrieved_at: retrievedAt
    };
  }
  if (!options.classifyImpl && !options.token?.trim()) {
    return insufficient(text, retrievedAt, "sentiment_source_unconfigured", "A Hugging Face Inference Providers token is required to classify text in this deployment.");
  }

  try {
    const classScores = options.classifyImpl
      ? await options.classifyImpl(text)
      : await classifySentiment(text, { token: options.token! });
    if (!Array.isArray(classScores) || classScores.length !== 3 ||
        classScores.some(item => !item || !["negative", "neutral", "positive"].includes(item.label) ||
          !Number.isFinite(item.score) || item.score < 0 || item.score > 1) ||
        new Set(classScores.map(item => item.label)).size !== 3 ||
        Math.abs(classScores.reduce((sum, item) => sum + item.score, 0) - 1) > 0.02) {
      throw new Error("invalid_classification");
    }

    const sorted = [...classScores].sort((a, b) => b.score - a.score);
    const top = sorted[0]!;
    const evidence = normalizeEvidence({
      source_id: `huggingface-model:${MODEL_ID}`,
      source_type: "huggingface-text-classification-model",
      title: `Model output: ${top.label}`,
      url: MODEL_CARD_URL,
      excerpt: `Model-reported class scores: ${sorted.map(item => `${item.label}=${item.score.toFixed(4)}`).join(", ")}.`,
      retrieved_at: retrievedAt
    });
    const lowScore = top.score < LOW_SCORE_THRESHOLD;
    return {
      intent: "SENTIMENT_ANALYSIS",
      verdict: lowScore ? "uncertain" : "likely",
      confidence: top.score,
      answer: {
        sentiment: top.label,
        model_score: top.score,
        class_scores: sorted,
        model: MODEL_ID,
        language_scope: "English"
      },
      evidence: [evidence],
      uncertainty: [
        { code: "model_scores_are_not_calibrated", message: "The score is reported by the classifier and is not a calibrated probability of the text's true sentiment." },
        ...(lowScore ? [{ code: "low_model_separation", message: "The top model score is below the configured 0.55 threshold; treat the predicted label as uncertain." }] : []),
        { code: "english_tweet_domain_model", message: "This English model was trained on social media text; performance may differ on other languages, domains, sarcasm, or context-dependent text." }
      ],
      retrieved_at: retrievedAt
    };
  } catch {
    return insufficient(text, retrievedAt, "sentiment_analysis_failed", "The configured sentiment model could not be reached or returned invalid output.");
  }
}
