import test from "node:test";
import assert from "node:assert/strict";
import { createIntentRouter, requestToIntentRequest } from "../dist/api.js";

const response = {
  intent: "FACT_CHECK",
  verdict: "confirmed",
  confidence: 0.9,
  answer: { result: "supported" },
  evidence: [],
  uncertainty: [],
  retrieved_at: "2026-10-06T00:00:00.000Z"
};

test("router dispatches a supported Intent to its handler", async () => {
  let received;
  const router = createIntentRouter({
    FACT_CHECK: async (input) => {
      received = input;
      return response;
    }
  });

  const result = await router.dispatch({
    intent: "FACT_CHECK",
    input: { claim: "Example" }
  });

  assert.deepEqual(received, { claim: "Example" });
  assert.equal(result?.intent, "FACT_CHECK");
});

test("router does not dispatch unsupported Intents", async () => {
  const router = createIntentRouter({});
  const result = await router.dispatch({
    intent: "NOT_A_CANONICAL_INTENT",
    input: {}
  });

  assert.equal(result, null);
});

test("router does not dispatch a supported Intent without a handler", async () => {
  const router = createIntentRouter({});
  const result = await router.dispatch({
    intent: "FACT_CHECK",
    input: {}
  });

  assert.equal(result, null);
});

test("request parser requires an Intent string", () => {
  assert.deepEqual(
    requestToIntentRequest({ intent: "FACT_CHECK", input: { claim: "x" } }),
    { intent: "FACT_CHECK", input: { claim: "x" } }
  );

  assert.equal(requestToIntentRequest({ input: {} }), null);
  assert.equal(requestToIntentRequest(null), null);
});

test("request parser preserves an omitted input as undefined", () => {
  assert.deepEqual(
    requestToIntentRequest({ intent: "FACT_CHECK" }),
    { intent: "FACT_CHECK", input: undefined }
  );
});
