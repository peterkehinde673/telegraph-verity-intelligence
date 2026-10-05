import test from "node:test";
import assert from "node:assert/strict";
import { factCheck } from "../dist/intents/fact-check.js";

test("fact check returns a supported verdict with normalized evidence", async () => {
  const result = await factCheck("The sample claim is true.", {
    checkImpl: async () => ({
      verdict: "true",
      explanation: "Two independent sources support the claim.",
      evidence: [{
        source_id: "source:1",
        source_type: "web",
        title: "Primary source",
        url: "https://example.com/source",
        excerpt: "Supporting excerpt."
      }]
    }),
    now: () => "2026-10-05T20:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.verdict, "true");
  assert.equal(result.evidence[0]?.source_id, "source:1");
});

test("fact check preserves a mixed conclusion", async () => {
  const result = await factCheck("The sample claim is partly true.", {
    checkImpl: async () => ({
      verdict: "mixed",
      explanation: "Some parts are supported while another part is contradicted.",
      evidence: [{
        source_id: "source:2",
        source_type: "web",
        title: "Source",
        excerpt: "Relevant evidence."
      }]
    })
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.verdict, "mixed");
});

test("fact check abstains when the claim is unverified", async () => {
  const result = await factCheck("An unsupported claim.", {
    checkImpl: async () => ({
      verdict: "unverified",
      explanation: "No sufficiently reliable evidence was found.",
      evidence: []
    })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("fact check rejects an empty claim before checker access", async () => {
  let called = false;
  const result = await factCheck(" ", {
    checkImpl: async () => {
      called = true;
      return { verdict: "true", explanation: "", evidence: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("fact check abstains without a configured checker", async () => {
  const result = await factCheck("A sample claim");
  assert.equal(result.verdict, "insufficient_evidence");
});
