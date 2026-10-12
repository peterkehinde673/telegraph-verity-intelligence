#!/usr/bin/env node
const baseUrl = process.argv[2] ?? "https://telegraph-verity-intelligence-api.onrender.com";
const expectedCount = 29;

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    signal: AbortSignal.timeout(15_000),
    ...options
  });
  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`${options.method ?? "GET"} ${path} did not return valid JSON (HTTP ${response.status}).`);
  }
  return { status: response.status, body: json };
}

async function get(path) {
  const result = await request(path);
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`GET ${path} returned HTTP ${result.status}: ${JSON.stringify(result.body)}`);
  }
  return result.body;
}

const health = await get("/health");
if (health.status !== "ok" || health.service !== "telegraph-verity-intelligence") {
  throw new Error("Health endpoint did not identify the expected service as healthy.");
}

const catalogue = await get("/intents");
if (!Array.isArray(catalogue.intents)) {
  throw new Error("Intent catalogue response does not contain an intents array.");
}
if (catalogue.count !== expectedCount || catalogue.intents.length !== expectedCount) {
  throw new Error(`Expected exactly ${expectedCount} Verity Intents, received count=${catalogue.count}, array length=${catalogue.intents.length}.`);
}
if (new Set(catalogue.intents).size !== expectedCount) {
  throw new Error("Intent catalogue contains duplicate names.");
}
if (catalogue.intents.some((intent) => typeof intent !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(intent))) {
  throw new Error("Intent catalogue contains an invalid canonical intent name.");
}
const seasonII = [
  ["URL_SAFE", { url: "file:///etc/passwd" }, "rejected"],
  ["THREAT_IP_REPUTATION", { ip_address: "999.999.1.1" }, "rejected"],
  ["THREAT_INTELLIGENCE", { indicator: "example.com", indicator_type: "invalid" }, "rejected"],
  ["SECURITY_REVIEW", {}, "rejected"],
  ["REGRESSION_VERIFY", { base_url: "http://example.com", checks: [{ path: "/health" }] }, "insufficient_evidence"],
  ["CODE_PATCH_VERIFY", { repository: "peterkehinde673/telegraph-verity-intelligence", commit_sha: "not-a-sha" }, "rejected"],
  ["VULNERABILITY_TRIAGE", { findings: [] }, "rejected"]
];

for (const [intent, input, expectedVerdict] of seasonII) {
  if (!catalogue.intents.includes(intent)) throw new Error(`Required Season II intent is missing: ${intent}`);
  const result = await request("/v1/intent", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ intent, input })
  });
  if (result.status !== 200) {
    throw new Error(`POST /v1/intent for ${intent} returned HTTP ${result.status}: ${JSON.stringify(result.body)}`);
  }
  const body = result.body;
  if (body.intent !== intent || body.verdict !== expectedVerdict) {
    throw new Error(`Unexpected safe-validation response for ${intent}: ${JSON.stringify(body)}`);
  }
  if (!Number.isFinite(body.confidence) || body.confidence < 0 || body.confidence > 1 ||
      !Array.isArray(body.evidence) || !Array.isArray(body.uncertainty) ||
      typeof body.retrieved_at !== "string") {
    throw new Error(`Response contract failed for ${intent}: ${JSON.stringify(body)}`);
  }
}

console.log(JSON.stringify({
  base_url: baseUrl,
  health,
  intent_count: catalogue.intents.length,
  season_ii_intents_verified: seasonII.length,
  post_response_contracts_verified: true
}, null, 2));
