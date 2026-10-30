import test from "node:test";
import assert from "node:assert/strict";
import { requestToIntentRequest } from "../dist/api.js";
import { validateVerityResponse } from "../dist/contracts/verity-response.js";

test("HTTP request contract accepts an intent plus opaque input payload", () => {
  const request = requestToIntentRequest({
    intent: "CVE_LOOKUP",
    input: { cve_id: "CVE-2026-0001" }
  });
  assert.deepEqual(request, {
    intent: "CVE_LOOKUP",
    input: { cve_id: "CVE-2026-0001" }
  });
});

test("HTTP request contract rejects requests without an intent", () => {
  assert.equal(requestToIntentRequest({ input: {} }), null);
  assert.equal(requestToIntentRequest("not-an-object"), null);
});

test("Verity response contract rejects invalid confidence", () => {
  const errors = validateVerityResponse({
    intent: "CVE_LOOKUP",
    verdict: "confirmed",
    confidence: 1.5,
    answer: {},
    evidence: [],
    uncertainty: [],
    retrieved_at: "2026-10-07T00:00:00.000Z"
  });
  assert.ok(errors.includes("confidence must be between 0 and 1"));
});

test("Verity response contract accepts a normalized response", () => {
  const errors = validateVerityResponse({
    intent: "CVE_LOOKUP",
    verdict: "insufficient_evidence",
    confidence: 0,
    answer: {},
    evidence: [],
    uncertainty: [{ code: "provider_unavailable", message: "No provider configured." }],
    retrieved_at: "2026-10-07T00:00:00.000Z"
  });
  assert.deepEqual(errors, []);
});
