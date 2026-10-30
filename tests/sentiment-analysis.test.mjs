import test from "node:test";
import assert from "node:assert/strict";
import { sentimentAnalysis } from "../dist/intents/sentiment-analysis.js";

const now = () => "2026-10-19T12:00:00.000Z";
const output = [
  { label: "negative", score: 0.08 },
  { label: "neutral", score: 0.12 },
  { label: "positive", score: 0.8 }
];

test("SENTIMENT_ANALYSIS reports the model label, score distribution, and model provenance", async () => {
  let receivedText;
  const result = await sentimentAnalysis("  I really like this.  ", {
    now,
    classifyImpl: async text => { receivedText = text; return output; }
  });
  assert.equal(receivedText, "I really like this.");
  assert.equal(result.intent, "SENTIMENT_ANALYSIS");
  assert.equal(result.verdict, "likely");
  assert.equal(result.confidence, 0.8);
  assert.equal(result.answer.sentiment, "positive");
  assert.equal(result.answer.model_score, 0.8);
  assert.equal(result.answer.language_scope, "English");
  assert.equal(result.evidence[0].source_id, "huggingface-model:cardiffnlp/twitter-roberta-base-sentiment-latest");
  assert.equal(result.evidence[0].url, "https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest");
  assert.equal(result.evidence[0].retrieved_at, now());
  assert.equal(result.uncertainty[0].code, "model_scores_are_not_calibrated");
});

test("SENTIMENT_ANALYSIS rejects empty, malformed and overlong text before provider access", async () => {
  let called = false;
  const classifyImpl = async () => { called = true; return output; };
  const empty = await sentimentAnalysis("  ", { now, classifyImpl });
  const malformed = await sentimentAnalysis({ text: "review" }, { now, classifyImpl });
  const long = await sentimentAnalysis("x".repeat(4001), { now, classifyImpl });
  assert.equal(empty.verdict, "rejected");
  assert.equal(empty.uncertainty[0].code, "empty_text");
  assert.equal(malformed.uncertainty[0].code, "invalid_text");
  assert.equal(long.uncertainty[0].code, "text_too_long");
  assert.equal(called, false);
});

test("SENTIMENT_ANALYSIS abstains without credentials and reports weak separation as uncertain", async () => {
  const unconfigured = await sentimentAnalysis("Some text", { now });
  const uncertain = await sentimentAnalysis("Some text", {
    now,
    classifyImpl: async () => [
      { label: "negative", score: 0.34 },
      { label: "neutral", score: 0.33 },
      { label: "positive", score: 0.33 }
    ]
  });
  assert.equal(unconfigured.verdict, "insufficient_evidence");
  assert.equal(unconfigured.uncertainty[0].code, "sentiment_source_unconfigured");
  assert.equal(uncertain.verdict, "uncertain");
  assert.equal(uncertain.uncertainty.some(item => item.code === "low_model_separation"), true);
});

test("SENTIMENT_ANALYSIS sanitizes failures and abstains on malformed classifier outputs", async () => {
  const failure = await sentimentAnalysis("Some text", {
    now, classifyImpl: async () => { throw new Error("hf_secret_token"); }
  });
  const malformed = await sentimentAnalysis("Some text", { now, classifyImpl: async () => null });
  const invalidScores = await sentimentAnalysis("Some text", {
    now,
    classifyImpl: async () => [
      { label: "negative", score: 0.9 },
      { label: "neutral", score: 0.9 },
      { label: "positive", score: 0.9 }
    ]
  });
  assert.equal(failure.uncertainty[0].code, "sentiment_analysis_failed");
  assert.equal(JSON.stringify(failure).includes("hf_secret_token"), false);
  assert.equal(malformed.uncertainty[0].code, "sentiment_analysis_failed");
  assert.equal(invalidScores.uncertainty[0].code, "sentiment_analysis_failed");
});
