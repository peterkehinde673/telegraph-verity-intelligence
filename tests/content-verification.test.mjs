import test from "node:test";
import assert from "node:assert/strict";
import { contentVerification } from "../dist/intents/content-verification.js";

test("content verification confirms supported content with evidence", async () => {
  const result = await contentVerification("The supplied content.", {
    verifyImpl: async () => ({
      signal: "verified",
      explanation: "The supplied content matches the verification source.",
      evidence: [{
        source_id: "verification:1",
        source_type: "primary-source",
        title: "Verification source",
        url: "https://example.com/source",
        excerpt: "Matching evidence."
      }]
    }),
    now: () => "2026-10-06T05:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.signal, "verified");
  assert.equal(result.evidence[0]?.source_id, "verification:1");
});

test("content verification reports a mismatch without overstating certainty", async () => {
  const result = await contentVerification("The supplied content.", {
    verifyImpl: async () => ({
      signal: "mismatch",
      explanation: "The supplied content conflicts with the verification source.",
      evidence: [{
        source_id: "verification:2",
        source_type: "primary-source",
        title: "Contradicting source",
        excerpt: "Contradicting evidence."
      }]
    })
  });

  assert.equal(result.verdict, "likely");
  assert.equal(result.answer.signal, "mismatch");
});

test("content verification abstains when verification is indeterminate", async () => {
  const result = await contentVerification("Uncertain content.", {
    verifyImpl: async () => ({
      signal: "indeterminate",
      explanation: "No reliable comparison was possible.",
      evidence: [{
        source_id: "verification:3",
        source_type: "source",
        title: "Insufficient source"
      }]
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("content verification does not accept an unsupported result without evidence", async () => {
  const result = await contentVerification("Unsupported content.", {
    verifyImpl: async () => ({
      signal: "verified",
      explanation: "Claimed verified without supporting evidence.",
      evidence: []
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("content verification rejects empty content before verifier access", async () => {
  let called = false;
  const result = await contentVerification(" ", {
    verifyImpl: async () => {
      called = true;
      return { signal: "verified", explanation: "", evidence: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("content verification abstains without a configured verifier", async () => {
  const result = await contentVerification("Sample content");
  assert.equal(result.verdict, "insufficient_evidence");
});
