import test from "node:test";
import assert from "node:assert/strict";
import { researchSynthesis } from "../dist/intents/research-synthesis.js";

const evidence = [{
  source_id: "paper:1",
  source_type: "paper",
  title: "Primary research",
  excerpt: "The study reports a measurable effect.",
  url: "https://example.com/paper"
}];

test("research synthesis preserves supplied evidence and returns a conclusion", async () => {
  const result = await researchSynthesis("What does the evidence show?", {
    evidence,
    synthesizeImpl: async (question, sources) => ({
      synthesis: "The supplied evidence supports a measurable effect.",
      key_points: [question, sources[0]?.title ?? ""]
    }),
    now: () => "2026-10-05T22:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.evidence[0]?.source_id, "paper:1");
  assert.match(result.answer.synthesis, /measurable effect/);
});

test("research synthesis passes only normalized source fields to the synthesizer", async () => {
  let received: Array<{ source_id: string; title: string; excerpt: string | null; url: string | null }> = [];
  await researchSynthesis("Question", {
    evidence,
    synthesizeImpl: async (_question, sources) => {
      received = sources;
      return { synthesis: "Conclusion", key_points: [] };
    }
  });

  assert.deepEqual(received, [{
    source_id: "paper:1",
    title: "Primary research",
    excerpt: "The study reports a measurable effect.",
    url: "https://example.com/paper"
  }]);
});

test("research synthesis abstains without source evidence", async () => {
  const result = await researchSynthesis("Question", {
    synthesizeImpl: async () => ({ synthesis: "Should not run", key_points: [] })
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
});

test("research synthesis rejects empty questions before synthesis", async () => {
  let called = false;
  const result = await researchSynthesis(" ", {
    evidence,
    synthesizeImpl: async () => {
      called = true;
      return { synthesis: "No", key_points: [] };
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(called, false);
});

test("research synthesis abstains without a configured synthesizer", async () => {
  const result = await researchSynthesis("Question", { evidence });
  assert.equal(result.verdict, "insufficient_evidence");
});
