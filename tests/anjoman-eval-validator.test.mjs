import test from "node:test";
import assert from "node:assert/strict";
import { validateEvaluationMaterial } from "../scripts/validate-anjoman-eval.mjs";

const pair = { prompt: "Assess 203.0.113.1", chosen: "Cautious answer", rejected: "Unsupported certainty" };
const evidence = {
  cases: [{
    case_id: "TII-001",
    prompt: pair.prompt,
    indicator_type: "ip",
    indicator_value: "203.0.113.1",
    expected_outcome: "abstain",
    sources: [{ url: "https://www.rfc-editor.org/rfc/rfc5737" }],
    ground_truth_rationale: "Reserved documentation range.",
    chosen_better_reason: "Does not infer current reputation.",
    rejected_worse_reason: "Claims maliciousness without evidence.",
    known_uncertainty: "Not a reputation-feed check.",
    reviewer_status: "verified"
  }]
};

test("Anjoman validator accepts a three-field preference pair with matching evidence", () => {
  const result = validateEvaluationMaterial(`${JSON.stringify(pair)}\n`, evidence);
  assert.equal(result.ready, true);
  assert.equal(result.pairCount, 1);
  assert.equal(result.evidenceReviewCount, 1);
});

test("Anjoman validator rejects malformed JSON, blank lines, extra keys, and empty fields", () => {
  const invalid = [
    "not json",
    `${JSON.stringify(pair)}\n\n${JSON.stringify(pair)}`,
    JSON.stringify({ ...pair, intent_id: "THREAT_INTELLIGENCE_INDICATOR" }),
    JSON.stringify({ ...pair, rejected: " " })
  ];
  for (const data of invalid) assert.equal(validateEvaluationMaterial(data, evidence).ready, false);
});

test("Anjoman validator rejects identical answers, duplicate prompts, placeholders, and secret-like text", () => {
  const sameAnswers = JSON.stringify({ ...pair, rejected: pair.chosen });
  assert.equal(validateEvaluationMaterial(sameAnswers, evidence).ready, false);
  const duplicatePrompt = `${JSON.stringify(pair)}\n${JSON.stringify({ ...pair, chosen: "Another answer", rejected: "Still worse" })}`;
  assert.equal(validateEvaluationMaterial(duplicatePrompt, { cases: [evidence.cases[0], { ...evidence.cases[0], case_id: "TII-002", chosen_better_reason: "Different" }] }).ready, false);
  assert.equal(validateEvaluationMaterial(JSON.stringify({ ...pair, chosen: "TODO: insert answer" }), evidence).ready, false);
  assert.equal(validateEvaluationMaterial(JSON.stringify({ ...pair, chosen: "api_key=very-long-secret-value" }), evidence).ready, false);
});

test("Anjoman validator reports missing, duplicate, and unreviewed evidence mappings", () => {
  const missing = validateEvaluationMaterial(JSON.stringify(pair), { cases: [] });
  assert.equal(missing.missingEvidenceCount, 1);
  const unreviewed = validateEvaluationMaterial(JSON.stringify(pair), { cases: [{ ...evidence.cases[0], reviewer_status: "pending" }] });
  assert.equal(unreviewed.ready, false);
  const duplicate = validateEvaluationMaterial(`${JSON.stringify(pair)}\n${JSON.stringify({ ...pair, prompt: "Assess 203.0.113.1", chosen: "Different chosen", rejected: "Different rejected" })}`, { cases: [evidence.cases[0]] });
  assert.equal(duplicate.duplicateCount > 0, true);
});
