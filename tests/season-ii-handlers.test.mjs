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
