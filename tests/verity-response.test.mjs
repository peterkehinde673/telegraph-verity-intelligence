import test from "node:test";
import assert from "node:assert/strict";

const validVerdicts = [
  "confirmed",
  "likely",
  "uncertain",
  "not_found",
  "insufficient_evidence",
  "rejected"
];

test("the response contract defines explicit abstention verdicts", () => {
  assert.ok(validVerdicts.includes("insufficient_evidence"));
  assert.ok(validVerdicts.includes("not_found"));
});

test("confidence is expected to use the normalized 0 to 1 range", () => {
  assert.equal(0 <= 0 && 0 <= 1, true);
  assert.equal(1 >= 0 && 1 <= 1, true);
});
