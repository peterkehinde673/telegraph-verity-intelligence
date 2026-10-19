import test from "node:test";
import assert from "node:assert/strict";
import { classifySentiment } from "../dist/providers/hf-sentiment.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const scores = [
  { label: "negative", score: 0.1 },
  { label: "neutral", score: 0.2 },
  { label: "positive", score: 0.7 }
];

test("Hugging Face classifier uses the pinned task/model route and validates attributable scores", async () => {
  let requestUrl;
  let init;
  const result = await classifySentiment("A positive review", {
    token: "test-token",
    fetchImpl: async (url, options) => {
      requestUrl = new URL(url);
      init = options;
      return jsonResponse([scores]);
    }
  });

  assert.equal(requestUrl.origin, "https://router.huggingface.co");
  assert.equal(requestUrl.pathname, "/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest");
  assert.equal(init.method, "POST");
  assert.equal(init.headers.authorization, "Bearer test-token");
  assert.equal(init.redirect, "error");
  assert.ok(init.signal);
  assert.deepEqual(JSON.parse(init.body), {
    inputs: "A positive review",
    parameters: { function_to_apply: "softmax", top_k: 3 }
  });
  assert.deepEqual(result, [
    { label: "positive", score: 0.7 },
    { label: "neutral", score: 0.2 },
    { label: "negative", score: 0.1 }
  ]);
});

test("Hugging Face classifier accepts the documented flat result shape", async () => {
  const result = await classifySentiment("Text", {
    token: "test-token",
    fetchImpl: async () => jsonResponse(scores)
  });
  assert.equal(result[0].label, "positive");
});

test("Hugging Face classifier rejects empty credentials, HTTP errors, malformed scores, and oversized bodies", async () => {
  await assert.rejects(() => classifySentiment("Text", { token: " " }), /not_configured/);
  await assert.rejects(() => classifySentiment("Text", {
    token: "test-token", fetchImpl: async () => jsonResponse({ error: "private" }, 401)
  }), /HTTP 401/);
  await assert.rejects(() => classifySentiment("Text", {
    token: "test-token", fetchImpl: async () => jsonResponse([{ label: "unknown", score: 1 }])
  }), /invalid scores/);
  await assert.rejects(() => classifySentiment("Text", {
    token: "test-token", fetchImpl: async () => jsonResponse([
      { label: "negative", score: 0.8 }, { label: "neutral", score: 0.5 }, { label: "positive", score: 0.1 }
    ])
  }), /normalized/);
  const oversized = new Response(JSON.stringify(scores) + " ".repeat(64 * 1024));
  await assert.rejects(() => classifySentiment("Text", {
    token: "test-token", fetchImpl: async () => oversized
  }), /exceeded the configured limit/);
});
