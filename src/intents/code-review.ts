import type { VerityEvidence, VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface CodeReviewFinding {
  rule_id: string;
  severity: "high" | "medium" | "low";
  line: number;
  message: string;
  recommendation: string;
}

export interface CodeReviewAnswer {
  findings: CodeReviewFinding[];
  files_or_snippets_reviewed: number;
  lines_reviewed: number;
  scope: "static-heuristics";
}

export interface CodeReviewOptions {
  now?: () => string;
}

const RULES: Array<{
  id: string;
  severity: CodeReviewFinding["severity"];
  pattern: RegExp;
  message: string;
  recommendation: string;
}> = [
  {
    id: "possible-hardcoded-secret",
    severity: "high",
    pattern: /(?:api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*["'`][^"'`]{8,}["'`]/i,
    message: "Possible hard-coded credential or secret.",
    recommendation: "Move secrets to a secret manager or environment variable and rotate any exposed credential."
  },
  {
    id: "dynamic-code-execution",
    severity: "high",
    pattern: /\beval\s*\(|new\s+Function\s*\(/,
    message: "Dynamic code execution can execute untrusted input.",
    recommendation: "Avoid eval and dynamic Function construction; use explicit parsing or allow-listed operations."
  },
  {
    id: "sql-string-concatenation",
    severity: "high",
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\b.*(?:\+\s*[a-z_$]|\$\{)/i,
    message: "Possible SQL statement built with string interpolation or concatenation.",
    recommendation: "Use parameterized queries and bind user-supplied values separately."
  },
  {
    id: "debug-output",
    severity: "low",
    pattern: /\bconsole\.(?:log|debug|info)\s*\(/,
    message: "Debug output may leak internal details or clutter production logs.",
    recommendation: "Use the application's structured logger and remove unnecessary debug output."
  },
  {
    id: "unfinished-work",
    severity: "low",
    pattern: /\b(?:TODO|FIXME|XXX)\b/,
    message: "Unfinished-work marker found.",
    recommendation: "Resolve the marker or create a tracked issue with an owner and acceptance criteria."
  },
  {
    id: "empty-catch",
    severity: "medium",
    pattern: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/,
    message: "An empty catch block may silently suppress failures.",
    recommendation: "Handle the error explicitly, or document why suppression is safe."
  }
];

export async function reviewCode(
  source: string,
  options: CodeReviewOptions = {}
): Promise<VerityResponse<CodeReviewAnswer>> {
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const normalized = source.trim();

  if (!normalized) {
    return {
      intent: "CODE_REVIEW",
      verdict: "rejected",
      confidence: 1,
      answer: { findings: [], files_or_snippets_reviewed: 0, lines_reviewed: 0, scope: "static-heuristics" },
      evidence: [],
      uncertainty: [{ code: "empty_code", message: "Provide source code or a diff to review." }],
      retrieved_at: retrievedAt
    };
  }

  const lines = normalized.split(/\r?\n/);
  const findings: CodeReviewFinding[] = [];
  const evidence: VerityEvidence[] = [];

  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        const finding: CodeReviewFinding = {
          rule_id: rule.id,
          severity: rule.severity,
          line: index + 1,
          message: rule.message,
          recommendation: rule.recommendation
        };
        findings.push(finding);
        evidence.push(normalizeEvidence({
          source_id: `code-review:line:${index + 1}:${rule.id}`,
          source_type: "static-code-review",
          title: `Line ${index + 1}: ${rule.id}`,
          excerpt: line.trim().slice(0, 500),
          retrieved_at: retrievedAt,
          metadata: { line: index + 1, severity: rule.severity, rule_id: rule.id }
        }));
      }
    }
  });

  const highFindings = findings.filter((finding) => finding.severity === "high").length;
  const mediumFindings = findings.filter((finding) => finding.severity === "medium").length;
  const confidence = findings.length === 0 ? 0.55 : Math.min(0.9, 0.65 + findings.length * 0.05);

  return {
    intent: "CODE_REVIEW",
    verdict: highFindings > 0 ? "likely" : findings.length > 0 ? "uncertain" : "uncertain",
    confidence,
    answer: {
      findings,
      files_or_snippets_reviewed: 1,
      lines_reviewed: lines.length,
      scope: "static-heuristics"
    },
    evidence,
    uncertainty: [
      {
        code: "static_review_only",
        message: "This is a bounded heuristic review, not a full semantic security audit. Findings may be false positives, and absence of findings does not prove the code is safe."
      },
      ...(mediumFindings > 0 ? [{
        code: "manual_validation_needed",
        message: "Review medium-severity findings in context before taking action."
      }] : [])
    ],
    retrieved_at: retrievedAt
  };
}
