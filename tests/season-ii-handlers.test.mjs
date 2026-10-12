import test from "node:test";
import assert from "node:assert/strict";
import { INTENT_HANDLERS } from "../dist/intent-handlers.js";
import { validateVerityResponse } from "../dist/contracts/verity-response.js";

function assertContract(response, intent) {
  assert.equal(response?.intent, intent);
  assert.ok(["confirmed", "likely", "uncertain", "not_found", "insufficient_evidence", "rejected"].includes(response?.verdict));
  assert.ok(Number.isFinite(response?.confidence) && response.confidence >= 0 && response.confidence <= 1);
  assert.ok(Array.isArray(response?.evidence));
  assert.ok(Array.isArray(response?.uncertainty));
  assert.ok(typeof response?.retrieved_at === "string" && response.retrieved_at.length > 0);
  assert.deepEqual(validateVerityResponse(response), []);
}

async function withoutEnv(names, callback) {
  const previous = new Map(names.map(name => [name, process.env[name]]));
  for (const name of names) delete process.env[name];
  try {
    await callback();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("Season II URL_SAFE rejects non-HTTP URLs without network access", async () => {
  const response = await INTENT_HANDLERS.URL_SAFE({ url: "file:///etc/passwd" });
  assertContract(response, "URL_SAFE");
  assert.equal(response.verdict, "rejected");
});

test("Season II URL_SAFE abstains when Safe Browsing is not configured", async () => {
  await withoutEnv(["GOOGLE_SAFE_BROWSING_API_KEY"], async () => {
    const response = await INTENT_HANDLERS.URL_SAFE({ url: "https://example.com/" });
    assertContract(response, "URL_SAFE");
    assert.equal(response.verdict, "insufficient_evidence");
    assert.equal(response.uncertainty[0].code, "reputation_source_unconfigured");
  });
});

test("Season II THREAT_IP_REPUTATION rejects malformed IP addresses", async () => {
  const response = await INTENT_HANDLERS.THREAT_IP_REPUTATION({ ip_address: "999.999.1.1" });
  assertContract(response, "THREAT_IP_REPUTATION");
  assert.equal(response.verdict, "rejected");
});

test("Season II THREAT_IP_REPUTATION abstains when AbuseIPDB is not configured", async () => {
  await withoutEnv(["ABUSEIPDB_API_KEY"], async () => {
    const response = await INTENT_HANDLERS.THREAT_IP_REPUTATION({ ip_address: "192.0.2.1" });
    assertContract(response, "THREAT_IP_REPUTATION");
    assert.equal(response.verdict, "insufficient_evidence");
    assert.equal(response.uncertainty[0].code, "reputation_source_unconfigured");
  });
});

test("Season II THREAT_INTELLIGENCE rejects invalid indicator types", async () => {
  const response = await INTENT_HANDLERS.THREAT_INTELLIGENCE({ indicator: "example.com", indicator_type: "unknown" });
  assertContract(response, "THREAT_INTELLIGENCE");
  assert.equal(response.verdict, "rejected");
});

test("Season II THREAT_INTELLIGENCE abstains when OTX is not configured", async () => {
  await withoutEnv(["OTX_API_KEY"], async () => {
    const response = await INTENT_HANDLERS.THREAT_INTELLIGENCE({ indicator: "example.com", indicator_type: "domain" });
    assertContract(response, "THREAT_INTELLIGENCE");
    assert.equal(response.verdict, "insufficient_evidence");
    assert.equal(response.uncertainty[0].code, "threat_feed_unconfigured");
  });
});

test("Season II SECURITY_REVIEW rejects an empty source input", async () => {
  const response = await INTENT_HANDLERS.SECURITY_REVIEW({});
  assertContract(response, "SECURITY_REVIEW");
  assert.equal(response.verdict, "rejected");
});

test("Season II REGRESSION_VERIFY abstains when the host allow-list is absent", async () => {
  await withoutEnv(["REGRESSION_ALLOWED_HOSTS"], async () => {
    const response = await INTENT_HANDLERS.REGRESSION_VERIFY({
      base_url: "https://example.com",
      checks: [{ path: "/health", expected_status: 200 }]
    });
    assertContract(response, "REGRESSION_VERIFY");
    assert.equal(response.verdict, "insufficient_evidence");
    assert.equal(response.uncertainty[0].code, "regression_hosts_not_configured");
  });
});

test("Season II CODE_PATCH_VERIFY rejects malformed commit SHAs without an external request", async () => {
  const response = await INTENT_HANDLERS.CODE_PATCH_VERIFY({
    repository: "peterkehinde673/telegraph-verity-intelligence",
    commit_sha: "not-a-sha"
  });
  assertContract(response, "CODE_PATCH_VERIFY");
  assert.equal(response.verdict, "rejected");
  assert.equal(response.uncertainty[0].code, "invalid_commit_sha");
});

test("Season II VULNERABILITY_TRIAGE rejects malformed finding collections", async () => {
  const response = await INTENT_HANDLERS.VULNERABILITY_TRIAGE({ findings: "not-an-array" });
  assertContract(response, "VULNERABILITY_TRIAGE");
  assert.equal(response.verdict, "rejected");
});


import { checkUrlSafe, googleSafeBrowsingLookup } from "../dist/intents/url-safe.js";
import { checkThreatIpReputation } from "../dist/intents/threat-ip-reputation.js";
import { lookupThreatIntelligence } from "../dist/intents/threat-intelligence.js";
import { reviewSecurity } from "../dist/intents/security-review.js";
import { verifyRegression } from "../dist/intents/regression-verify.js";
import { verifyCodePatch } from "../dist/intents/code-patch-verify.js";
import { triageVulnerabilities } from "../dist/intents/vulnerability-triage.js";

test("Season II URL_SAFE returns a feed-qualified non-match using a controlled provider", async () => {
  const response = await checkUrlSafe("https://example.com/", {
    lookupImpl: async () => [],
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "URL_SAFE");
  assert.equal(response.verdict, "not_found");
  assert.equal(response.answer.safe_on_checked_feeds, true);
  assert.ok(response.uncertainty.some(item => item.code === "feed_non_match_is_not_a_guarantee"));
});

test("Season II THREAT_IP_REPUTATION normalizes a provider score and includes caveats", async () => {
  const response = await checkThreatIpReputation("8.8.8.8", {
    lookupImpl: async () => ({ abuse_confidence_score: 88, total_reports: 20, country_code: "US" }),
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "THREAT_IP_REPUTATION");
  assert.equal(response.verdict, "confirmed");
  assert.equal(response.answer.abuse_confidence_score, 88);
  assert.ok(response.uncertainty.some(item => item.code === "reputation_is_signal_not_proof"));
});

test("Season II THREAT_INTELLIGENCE handles a controlled OTX pulse result", async () => {
  const response = await lookupThreatIntelligence({ indicator: "example.com", indicator_type: "domain" }, {
    lookupImpl: async () => ({ pulse_count: 1, pulses: [{ name: "Test pulse", tags: ["test"] }] }),
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "THREAT_INTELLIGENCE");
  assert.equal(response.verdict, "likely");
  assert.equal(response.answer.pulse_count, 1);
  assert.ok(response.uncertainty.some(item => item.code === "single_feed_limit"));
});

test("Season II SECURITY_REVIEW reports a possible hard-coded secret with line evidence", async () => {
  const response = await reviewSecurity({ code: 'const api_key = "example-secret-value-123";' }, {
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "SECURITY_REVIEW");
  assert.ok(response.answer.findings.some(item => item.rule_id === "possible-hardcoded-secret"));
  assert.ok(response.evidence.some(item => item.source_type === "static-security-review"));
});

test("Season II REGRESSION_VERIFY passes an allowlisted GET with JSON assertions", async () => {
  const response = await verifyRegression({
    base_url: "https://api.example.com",
    checks: [{ name: "health", path: "/health", expected_status: 200, json_path: "status", equals: "ok" }]
  }, {
    allowedHosts: ["api.example.com"],
    fetchImpl: async () => new Response(JSON.stringify({ status: "ok" }), {
      status: 200, headers: { "content-type": "application/json" }
    }),
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "REGRESSION_VERIFY");
  assert.equal(response.verdict, "confirmed");
  assert.equal(response.answer.passed, 1);
  assert.equal(response.answer.errors, 0);
});

test("Season II CODE_PATCH_VERIFY summarizes mocked GitHub check runs", async () => {
  const response = await verifyCodePatch({
    repository: "owner/repo",
    commit_sha: "a".repeat(40)
  }, {
    fetchImpl: async () => new Response(JSON.stringify({
      check_runs: [{
        name: "CI",
        status: "completed",
        conclusion: "success",
        html_url: "https://github.com/owner/repo/actions/runs/1",
        app: { name: "GitHub Actions" }
      }]
    }), { status: 200, headers: { "content-type": "application/json" } }),
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "CODE_PATCH_VERIFY");
  assert.equal(response.verdict, "confirmed");
  assert.equal(response.answer.successful, 1);
  assert.equal(response.answer.failed, 0);
});

test("Season II VULNERABILITY_TRIAGE ranks known-exploited exposed critical assets first", async () => {
  const response = await triageVulnerabilities({
    findings: [
      { id: "low", cvss_score: 2.1, known_exploited: false, asset_criticality: "low", internet_exposed: false },
      { id: "urgent", cvss_score: 9.8, known_exploited: true, asset_criticality: "critical", internet_exposed: true }
    ]
  }, { now: () => "2026-10-12T00:00:00.000Z" });
  assertContract(response, "VULNERABILITY_TRIAGE");
  assert.equal(response.answer.findings_ranked[0].id, "urgent");
  assert.equal(response.answer.findings_ranked[0].priority, "P1");
  assert.equal(response.answer.external_feeds_queried, false);
});


test("Season II URL_SAFE abstains when the provider lookup fails", async () => {
  const response = await checkUrlSafe("https://example.com/", {
    lookupImpl: async () => { throw new Error("provider unavailable"); },
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "URL_SAFE");
  assert.equal(response.verdict, "insufficient_evidence");
  assert.equal(response.confidence, 0);
  assert.equal(response.evidence.length, 0);
  assert.equal(response.uncertainty[0].code, "reputation_lookup_failed");
});

test("Season II THREAT_IP_REPUTATION abstains when AbuseIPDB fails", async () => {
  const response = await checkThreatIpReputation("8.8.8.8", {
    lookupImpl: async () => { throw new Error("provider unavailable"); },
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "THREAT_IP_REPUTATION");
  assert.equal(response.verdict, "insufficient_evidence");
  assert.equal(response.confidence, 0);
  assert.equal(response.evidence.length, 0);
  assert.equal(response.uncertainty[0].code, "reputation_lookup_failed");
});

test("Season II THREAT_INTELLIGENCE abstains when OTX fails", async () => {
  const response = await lookupThreatIntelligence({ indicator: "example.com", indicator_type: "domain" }, {
    lookupImpl: async () => { throw new Error("provider unavailable"); },
    now: () => "2026-10-12T00:00:00.000Z"
  });
  assertContract(response, "THREAT_INTELLIGENCE");
  assert.equal(response.verdict, "insufficient_evidence");
  assert.equal(response.confidence, 0);
  assert.equal(response.evidence.length, 0);
  assert.equal(response.uncertainty[0].code, "threat_feed_lookup_failed");
});


test("Google Safe Browsing surfaces sanitized 403 reason codes without leaking credentials", async () => {
  await assert.rejects(
    googleSafeBrowsingLookup("https://example.com/", "test-secret-key", async () => new Response(
      JSON.stringify({ error: { status: "PERMISSION_DENIED", errors: [{ reason: "SERVICE_DISABLED" }] } }),
      { status: 403, headers: { "content-type": "application/json" } }
    )),
    /HTTP 403 \(PERMISSION_DENIED, SERVICE_DISABLED\)/
  );
});
