import test from "node:test";
import assert from "node:assert/strict";
import { requestToIntentRequest } from "../dist/api.js";

test("HTTP request contract accepts an Intent execution envelope", () => {
  const parsed = requestToIntentRequest({
    intent: "FACT_CHECK",
    input: { claim: "Example claim" }
  });

  assert.deepEqual(parsed, {
    intent: "FACT_CHECK",
    input: { claim: "Example claim" }
  });
});

test("HTTP request contract rejects a missing Intent", () => {
  assert.equal(requestToIntentRequest({ input: {} }), null);
});
