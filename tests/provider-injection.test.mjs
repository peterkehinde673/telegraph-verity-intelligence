import test from "node:test";
import assert from "node:assert/strict";
import { createIntentHandlers } from "../dist/intent-handlers.js";

test("provider dependencies can be injected without changing the Intent contract", async () => {
  const handlers = createIntentHandlers({
    FACT_CHECK: {
      checkImpl: async () => ({
        verdict: "true",
        explanation: "Test provider evidence supports the claim.",
        evidence: [{
          source_id: "test:fact:1",
          source_type: "test",
          title: "Test source",
          url: "https://example.com",
          excerpt: "Supporting evidence"
        }]
      })
    }
  });

  const result = await handlers.FACT_CHECK?.({ claim: "Test claim" });
  assert.equal(result?.intent, "FACT_CHECK");
  assert.equal(result?.verdict, "confirmed");
  assert.equal(result?.confidence > 0, true);
});

test("WEB_SEARCH dispatches through its injected attributable search source", async () => {
  const handlers = createIntentHandlers({
    WEB_SEARCH: {
      searchImpl: async query => [{
        title: `Result for ${query}`,
        url: "https://search.example/result",
        source_id: "test-web:result",
        source_type: "test-web-search"
      }]
    }
  });
  const result = await handlers.WEB_SEARCH?.({ query: "fresh information" });

  assert.equal(result?.intent, "WEB_SEARCH");
  assert.equal(result?.verdict, "confirmed");
  assert.equal(result?.answer.results[0]?.title, "Result for fresh information");
  assert.equal(result?.evidence[0]?.source_id, "test-web:result");
});

test("unconfigured providers continue to abstain", async () => {
  const handlers = createIntentHandlers();
  const result = await handlers.AI_TEXT_DETECTION?.({ text: "Example text" });
  assert.equal(result?.verdict, "insufficient_evidence");
  assert.equal(result?.confidence, 0);
});
