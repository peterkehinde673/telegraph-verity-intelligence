import type { VerityEvidence, VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface SecurityReviewFinding {
  rule_id: string;
  severity: "critical" | "high" | "medium" | "low";
  line: number;
  message: string;
  recommendation: string;
}

export interface SecurityReviewAnswer {
  findings: SecurityReviewFinding[];
  lines_reviewed: number;
  scope: "static-security-heuristics";
  dependency_scan_performed: false;
}

export interface SecurityReviewOptions {
  now?: () => string;
}

const RULES: Array<{
  id: string;
  severity: SecurityReviewFinding["severity"];
  pattern: RegExp;
  message: string;
  recommendation: string;
}> = [
  {
    id: "possible-hardcoded-secret",
    severity: "critical",
    pattern: /(?:api[_-]?key|client[_-]?secret|password|access[_-]?token|private[_-]?key)\s*[:=]\s*["'`][^"'`\s]{8,}["'`]/i,
    message: "Possible hard-coded secret or credential.",
    recommendation: "Remove the secret from source history, rotate it, and load the replacement from a secret manager."
  },
  {
    id: "command-injection-risk",
    severity: "high",
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\([^\n]*(?:\+\s*[a-z_$]|\$\{)/i,
    message: "Command execution appears to interpolate a variable into a shell command.",
    recommendation: "Avoid shell interpretation for untrusted data; use argument arrays, strict allow-lists, and safe APIs."
  },
  {
    id: "sql-injection-risk",
    severity: "high",
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\b[^\n]*(?:\$\{|\+\s*[a-z_$])/i,
    message: "SQL statement may be constructed using string interpolation or concatenation.",
    recommendation: "Use parameterized queries and bind user-controlled values separately."
  },
  {
    id: "dynamic-code-execution",
    severity: "high",
    pattern: /\beval\s*\(|new\s+Function\s*\(/,
    message: "Dynamic code execution can turn untrusted input into executable code.",
    recommendation: "Replace dynamic execution with explicit parsing and allow-listed operations."
  },
  {
    id: "disabled-tls-validation",
    severity: "high",
    pattern: /(?:rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*[=:]\s*["']?0)/i,
    message: "TLS certificate validation appears to be disabled.",
    recommendation: "Enable certificate validation and fix the certificate chain instead of bypassing verification."
  },
  {
    id: "permissive-cors",
    severity: "medium",
    pattern: /(?:Access-Control-Allow-Origin|origin)\s*[:=]\s*["']\*["']/i,
    message: "A permissive CORS wildcard may expose browser-accessible APIs more broadly than intended.",
    recommendation: "Restrict allowed origins to the trusted domains that need access; avoid wildcard origins with credentials."
  },
  {
    id: "weak-hash",
    severity: "medium",
    pattern: /\b(?:md5|sha1)\s*\(/i,
    message: "A legacy hash function appears in use and may be unsuitable for security-sensitive integrity or password use.",
    recommendation: "Use a modern cryptographic hash for integrity checks and a dedicated password-hashing algorithm for passwords."
  },
  {
    id: "insecure-randomness",
    severity: "medium",
    pattern: /Math\.random\s*\(/,
    message: "Non-cryptographic randomness appears in code that may need security-grade randomness.",
    recommendation: "For tokens, secrets, or security-sensitive identifiers, use a cryptographically secure random generator."
  },
  {
    id: "debug-output",
    severity: "low",
    pattern: /\bconsole\.(?:log|debug|info)\s*\(/,
    message: "Debug output may expose internal details in production logs.",
    recommendation: "Use structured logging with appropriate redaction and log levels."
  }
];

export async function reviewSecurity(
  input: unknown,
  options: SecurityReviewOptions = {}
): Promise<VerityResponse<SecurityReviewAnswer>> {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const source = [
    typeof value.code === "string" ? value.code : "",
    typeof value.source_code === "string" ? value.source_code : "",
    typeof value.configuration === "string" ? value.configuration : "",
    typeof value.config === "string" ? value.config : "",
    typeof value.dependencies === "string" ? value.dependencies : ""
  ].filter(Boolean).join("\n");
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const lines = source.trim() ? source.split(/\r?\n/) : [];
  const emptyAnswer: SecurityReviewAnswer = {
    findings: [],
    lines_reviewed: 0,
    scope: "static-security-heuristics",
    dependency_scan_performed: false
  };

  if (!source.trim()) {
    return {
      intent: "SECURITY_REVIEW",
      verdict: "rejected",
      confidence: 1,
      answer: emptyAnswer,
      evidence: [],
      uncertainty: [{ code: "security_input_missing", message: "Provide source code or configuration using code, source_code, configuration, or config." }],
      retrieved_at: retrievedAt
    };
  }

  const findings: SecurityReviewFinding[] = [];
  const evidence: VerityEvidence[] = [];
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue;
      findings.push({
        rule_id: rule.id,
        severity: rule.severity,
        line: index + 1,
        message: rule.message,
        recommendation: rule.recommendation
      });
      evidence.push(normalizeEvidence({
        source_id: `security-review:line:${index + 1}:${rule.id}`,
        source_type: "static-security-review",
        title: `Line ${index + 1}: ${rule.id}`,
        excerpt: line.trim().slice(0, 500),
        retrieved_at: retrievedAt,
        metadata: { line: index + 1, severity: rule.severity, rule_id: rule.id }
      }));
    }
  });

  const criticalOrHigh = findings.some(item => item.severity === "critical" || item.severity === "high");
  const medium = findings.some(item => item.severity === "medium");
  return {
    intent: "SECURITY_REVIEW",
    verdict: criticalOrHigh ? "likely" : findings.length ? "uncertain" : "uncertain",
    confidence: findings.length ? Math.min(0.92, 0.65 + findings.length * 0.04) : 0.55,
    answer: {
      findings,
      lines_reviewed: lines.length,
      scope: "static-security-heuristics",
      dependency_scan_performed: false
    },
    evidence,
    uncertainty: [
      {
        code: "static_security_review_only",
        message: "This is a bounded static heuristic scan, not a full security audit. Findings require manual validation, and no findings do not prove the system is secure."
      },
      {
        code: "dependency_scan_not_performed",
        message: "Dependency vulnerability feeds were not queried by this handler. Use CVE_LOOKUP for known CVE identifiers and a dedicated dependency scanner for package manifests."
      },
      ...(medium ? [{
        code: "manual_context_review",
        message: "Review medium-severity findings in context to distinguish genuine risks from false positives."
      }] : [])
    ],
    retrieved_at: retrievedAt
  };
}
