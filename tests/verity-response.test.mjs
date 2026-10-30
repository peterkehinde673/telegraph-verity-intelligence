import test from "node:test";
import assert from "node:assert/strict";
import { validateVerityResponse } from "../dist/contracts/verity-response.js";

const validResponse = {
  intent: "FACT_CHECK",
  verdict: "uncertain",
  confidence: 0.4,
  answer: { claim: "Example claim", result: "uncertain" },
  evidence: [{
    source_id: "fixture:example",
    source_type: "fixture",
    title: "Example source",
    retrieved_at: "2026-10-14T00:00:00.000Z",
    metadata: { checked: true, count: 1, note: null }
  }],
  uncertainty: [{ code: "limited_sources", message: "Only one source was available." }],
  retrieved_at: "2026-10-14T00:00:00.000Z"
};

test("accepts a complete Verity response and its expected intent", () => {
  assert.deepEqual(validateVerityResponse(validResponse, "FACT_CHECK"), []);
});

test("rejects malformed top-level response fields", () => {
  const malformed = {
    ...validResponse,
    intent: "NOT_A_VERITY_INTENT",
    verdict: "made-up",
    confidence: Number.NaN,
    answer: undefined,
    retrieved_at: "not-a-timestamp"
  };

  const errors = validateVerityResponse(malformed, "FACT_CHECK");
  assert.ok(errors.includes("intent must be a supported Verity Intent"));
  assert.ok(errors.includes("verdict must be a supported Verity verdict"));
  assert.ok(errors.includes("confidence must be a finite number"));
  assert.ok(errors.includes("answer is required"));
  assert.ok(errors.includes("retrieved_at must be a valid timestamp"));
});

test("rejects a response attributed to a different requested intent", () => {
  assert.deepEqual(
    validateVerityResponse(validResponse, "NEWS_SEARCH"),
    ["intent must match the requested Intent"]
  );
});

test("rejects malformed evidence and non-scalar metadata", () => {
  const malformed = {
    ...validResponse,
    evidence: [null, {
      source_id: "",
      source_type: 3,
      retrieved_at: "invalid-date",
      url: 7,
      metadata: { nested: { value: "not scalar" }, nonFinite: Number.POSITIVE_INFINITY }
    }]
  };

  const errors = validateVerityResponse(malformed);
  assert.ok(errors.includes("evidence[0] must be an object"));
  assert.ok(errors.includes("evidence[1].source_id is required"));
  assert.ok(errors.includes("evidence[1].source_type is required"));
  assert.ok(errors.includes("evidence[1].retrieved_at must be a valid timestamp"));
  assert.ok(errors.includes("evidence[1].url must be a string"));
  assert.ok(errors.includes("evidence[1].metadata values must be JSON scalars"));
});

test("rejects malformed uncertainty entries", () => {
  const errors = validateVerityResponse({ ...validResponse, uncertainty: [null, { code: "", message: 1 }] });
  assert.ok(errors.includes("uncertainty[0] must be an object"));
  assert.ok(errors.includes("uncertainty[1].code is required"));
  assert.ok(errors.includes("uncertainty[1].message is required"));
});

test("rejects a non-object response", () => {
  assert.deepEqual(validateVerityResponse(null), ["response must be an object"]);
});
