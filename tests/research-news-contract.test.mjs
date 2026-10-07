import test from "node:test";
import assert from "node:assert/strict";
import { researchQuery } from "../dist/intents/research-query.js";
import { newsHeadlines } from "../dist/intents/news-headlines.js";
import { researchSynthesis } from "../dist/intents/research-synthesis.js";

const now = () => "2026-10-07T00:00:00.000Z";

test("research query preserves source provenance", async () => {
  const result = await researchQuery("telegraph protocol", {
    now,
    searchImpl: async () => [{
      title: "Example source",
      url: "https://example.com/source",
      excerpt: "Evidence",
      source_id: "example:1",
      source_type: "example"
    }]
  });
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.evidence[0]?.source_id, "example:1");
  assert.equal(result.retrieved_at, now());
});

test("news headlines rejects empty topics and abstains on empty provider results", async () => {
  const rejected = await newsHeadlines(" ", { now });
  assert.equal(rejected.verdict, "rejected");

  const empty = await newsHeadlines("test", { now, fetchImpl: async () => [] });
  assert.equal(empty.verdict, "insufficient_evidence");
  assert.equal(empty.confidence, 0);
});

test("research synthesis requires evidence before invoking a model", async () => {
  let called = false;
  const result = await researchSynthesis("What happened?", {
    now,
    synthesizeImpl: async () => {
      called = true;
      return { synthesis: "unsupported", key_points: [] };
    }
  });
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(called, false);
});

test("research synthesis preserves all supplied evidence provenance", async () => {
  const result = await researchSynthesis("What happened?", {
    now,
    evidence: [{
      source_id: "source:1",
      source_type: "journal",
      title: "Primary source",
      url: "https://example.com/paper",
      excerpt: "Observed fact",
      published_at: "2026-10-01T00:00:00.000Z"
    }],
    synthesizeImpl: async (_question, evidence) => ({
      synthesis: "Evidence-based synthesis.",
      key_points: [evidence[0]?.excerpt ?? ""]
    })
  });
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.evidence[0]?.source_id, "source:1");
  assert.equal(result.answer.key_points[0], "Observed fact");
});
