#!/usr/bin/env node
const baseUrl = process.argv[2] ?? "https://telegraph-verity-intelligence-api.onrender.com";
const expectedCount = 29;

async function get(path) {
  const response = await fetch(new URL(path, baseUrl), { signal: AbortSignal.timeout(15_000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`GET ${path} returned HTTP ${response.status}: ${body}`);
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`GET ${path} did not return valid JSON.`);
  }
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
for (const required of ["URL_SAFE", "THREAT_IP_REPUTATION", "THREAT_INTELLIGENCE", "SECURITY_REVIEW", "REGRESSION_VERIFY", "CODE_PATCH_VERIFY", "VULNERABILITY_TRIAGE"]) {
  if (!catalogue.intents.includes(required)) throw new Error(`Required Season II intent is missing: ${required}`);
}

console.log(JSON.stringify({
  base_url: baseUrl,
  health,
  intent_count: catalogue.intents.length,
  season_ii_intents_verified: true
}, null, 2));
