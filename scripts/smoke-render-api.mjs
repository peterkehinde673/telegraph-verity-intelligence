#!/usr/bin/env node
const baseUrl = process.argv[2] ?? "https://telegraph-verity-intelligence-api.onrender.com";

async function get(path) {
  const response = await fetch(new URL(path, baseUrl));
  const body = await response.text();
  if (!response.ok) throw new Error(`GET ${path} returned HTTP ${response.status}: ${body}`);
  return JSON.parse(body);
}

const health = await get("/health");
if (health.status !== "ok") throw new Error("Health endpoint did not report status=ok.");

const catalogue = await get("/intents");
if (!Array.isArray(catalogue.intents) || catalogue.intents.length !== 20) {
  throw new Error(`Expected 20 Verity Intents, received ${catalogue.intents?.length ?? "unknown"}.`);
}

console.log(JSON.stringify({
  base_url: baseUrl,
  health,
  intent_count: catalogue.intents.length
}, null, 2));
