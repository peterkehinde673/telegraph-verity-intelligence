#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const REQUIRED_FIELDS = ["prompt", "chosen", "rejected"];
const PLACEHOLDER = /\b(?:TODO|TBD|lorem ipsum|insert (?:answer|source|indicator)|placeholder text)\b/i;
const SECRET = /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:api[_ -]?key|password|secret|token)\s*[:=]\s*['"]?[^\s'"]{12,}|\bBearer\s+[A-Za-z0-9._~+/-]{20,})/i;

function normalize(value) {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("en-US");
}

function error(errors, line, message) {
  errors.push(line ? `line ${line}: ${message}` : message);
}

export function validateEvaluationMaterial(jsonl, evidenceRegister) {
  const errors = [];
  const lines = jsonl.split("\n");
  if (lines.at(-1) === "") lines.pop();
  const records = [];
  const prompts = new Map();
  const pairs = new Set();
  let structurallyValidCount = 0;
  const rejectedRecords = new Set();

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const lineErrorStart = errors.length;
    if (!line.trim()) {
      error(errors, lineNo, "blank lines are not allowed between JSONL records");
      rejectedRecords.add(index);
      return;
    }
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      error(errors, lineNo, "invalid JSON");
      rejectedRecords.add(index);
      return;
    }
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      error(errors, lineNo, "record must be a JSON object");
      rejectedRecords.add(index);
      return;
    }
    const keys = Object.keys(record).sort();
    if (JSON.stringify(keys) !== JSON.stringify([...REQUIRED_FIELDS].sort())) {
      error(errors, lineNo, `record must contain exactly: ${REQUIRED_FIELDS.join(", ")}`);
      rejectedRecords.add(index);
      return;
    }
    if (REQUIRED_FIELDS.some((field) => typeof record[field] !== "string" || !record[field].trim())) {
      error(errors, lineNo, "prompt, chosen, and rejected must be non-empty strings");
      rejectedRecords.add(index);
      return;
    }
    if (record.chosen.trim() === record.rejected.trim()) {
      error(errors, lineNo, "chosen and rejected must differ");
    }
    for (const field of REQUIRED_FIELDS) {
      if (PLACEHOLDER.test(record[field])) error(errors, lineNo, `${field} contains placeholder text`);
      if (SECRET.test(record[field])) error(errors, lineNo, `${field} resembles a credential or secret`);
    }
    const promptKey = normalize(record.prompt);
    if (prompts.has(promptKey)) error(errors, lineNo, `duplicate prompt (first seen on line ${prompts.get(promptKey)})`);
    else prompts.set(promptKey, lineNo);
    const answerPair = [normalize(record.chosen), normalize(record.rejected)].sort().join("\u0000");
    if (pairs.has(answerPair)) error(errors, lineNo, "duplicate chosen/rejected pair");
    pairs.add(answerPair);
    records.push({ record, lineIndex: index });
    if (errors.length === lineErrorStart) structurallyValidCount += 1;
    else rejectedRecords.add(index);
  });

  const entries = Array.isArray(evidenceRegister?.cases) ? evidenceRegister.cases : [];
  if (!Array.isArray(evidenceRegister?.cases)) error(errors, 0, "evidence register must contain a cases array");
  const evidenceByPrompt = new Map();
  const invalidEvidencePrompts = new Set();
  const caseIds = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || typeof entry.case_id !== "string" || typeof entry.prompt !== "string") {
      error(errors, 0, "each evidence entry needs case_id and prompt strings");
      continue;
    }
    if (caseIds.has(entry.case_id)) error(errors, 0, `duplicate evidence case_id ${entry.case_id}`);
    caseIds.add(entry.case_id);
    const key = normalize(entry.prompt);
    if (evidenceByPrompt.has(key)) error(errors, 0, `duplicate evidence prompt for ${entry.case_id}`);
    evidenceByPrompt.set(key, entry);
    let entryValid = true;
    if (!Array.isArray(entry.sources) || entry.sources.length === 0 ||
        !entry.sources.every((source) => typeof source?.url === "string" && /^https:\/\//.test(source.url))) {
      error(errors, 0, `${entry.case_id} needs one or more HTTPS evidence sources`);
      entryValid = false;
    }
    for (const field of ["indicator_type", "indicator_value", "expected_outcome", "ground_truth_rationale", "chosen_better_reason", "rejected_worse_reason", "known_uncertainty", "reviewer_status"]) {
      if (typeof entry[field] !== "string" || !entry[field].trim()) {
        error(errors, 0, `${entry.case_id} is missing ${field}`);
        entryValid = false;
      }
    }
    if (!entryValid) invalidEvidencePrompts.add(key);
  }

  let missingEvidenceCount = 0;
  let evidenceReviewCount = 0;
  records.forEach(({ record, lineIndex }) => {
    const entry = evidenceByPrompt.get(normalize(record.prompt));
    if (!entry) {
      missingEvidenceCount += 1;
      error(errors, 0, `no evidence record matches prompt: ${record.prompt.slice(0, 80)}`);
      rejectedRecords.add(lineIndex);
      return;
    }
    const entryValid = !invalidEvidencePrompts.has(normalize(record.prompt));
    if (entryValid && entry.reviewer_status === "verified") evidenceReviewCount += 1;
    else rejectedRecords.add(lineIndex);
  });
  for (const entry of entries) {
    if (typeof entry?.prompt === "string" && !prompts.has(normalize(entry.prompt))) {
      error(errors, 0, `evidence entry ${entry.case_id} has no matching JSONL prompt`);
    }
  }

  return {
    pairCount: records.length,
    structurallyValidCount,
    evidenceReviewCount,
    rejectedCount: rejectedRecords.size,
    duplicateCount: errors.filter((item) => /duplicate/i.test(item)).length,
    missingEvidenceCount,
    unresolvedIssues: errors,
    ready: errors.length === 0 && records.length > 0 && structurallyValidCount === records.length &&
      rejectedRecords.size === 0 && evidenceReviewCount === records.length
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [, , jsonlPath, evidencePath] = process.argv;
  if (!jsonlPath || !evidencePath) {
    console.error("Usage: node scripts/validate-anjoman-eval.mjs <pairs.jsonl> <evidence-register.json>");
    process.exit(2);
  }
  const [jsonl, evidenceText] = await Promise.all([readFile(jsonlPath, "utf8"), readFile(evidencePath, "utf8")]);
  let evidenceRegister;
  try {
    evidenceRegister = JSON.parse(evidenceText);
  } catch {
    console.error("Evidence register is not valid JSON.");
    process.exit(1);
  }
  const report = validateEvaluationMaterial(jsonl, evidenceRegister);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ready) process.exit(1);
}
