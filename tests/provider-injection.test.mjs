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

test("unconfigured providers continue to abstain", async () => {
  const handlers = createIntentHandlers();
  const result = await handlers.AI_TEXT_DETECTION?.({ text: "Example text" });
  assert.equal(result?.verdict, "insufficient_evidence");
  assert.equal(result?.confidence, 0);
});
