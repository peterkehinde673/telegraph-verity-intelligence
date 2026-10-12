import test from "node:test";
import assert from "node:assert/strict";
import { reviewSecurity } from "../dist/intents/security-review.js";

test("SECURITY_REVIEW flags dangerous patterns with line evidence", async () => {
  const result = await reviewSecurity({
    code: [
      'const api_key = "abcdefghijklmnop";',
      'const query = "SELECT * FROM users WHERE id = " + userId;',
      'process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";'
    ].join("\n"),
  }, { now: () => "2026-10-12T00:00:00.000Z" });

  assert.equal(result.intent, "SECURITY_REVIEW");
  assert.equal(result.verdict, "likely");
  assert.ok(result.answer.findings.some(f => f.rule_id === "possible-hardcoded-secret"));
  assert.ok(result.answer.findings.some(f => f.rule_id === "sql-injection-risk"));
  assert.ok(result.answer.findings.some(f => f.rule_id === "disabled-tls-validation"));
  assert.ok(result.evidence.length >= 3);
});

test("SECURITY_REVIEW rejects missing source and labels its scope", async () => {
  const empty = await reviewSecurity({});
  const clean = await reviewSecurity({ configuration: "server.port=3000\nlogging.level=info" });
  assert.equal(empty.verdict, "rejected");
  assert.equal(clean.answer.scope, "static-security-heuristics");
  assert.equal(clean.answer.dependency_scan_performed, false);
  assert.ok(clean.uncertainty.some(item => item.code === "dependency_scan_not_performed"));
});
