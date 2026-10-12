#!/usr/bin/env node
const baseUrl = process.env.TELEGRAPH_NODE_URL ?? "https://devnode.telegraphprotocol.com";
const expectedSlug = process.env.TELEGRAPH_MINER_SLUG ?? "telegraph-verity-intelligence";
const yamlResponse = await fetch("https://raw.githubusercontent.com/peterkehinde673/telegraph-verity-intelligence/foundation/verity-20-intents/miner.yaml", { signal: AbortSignal.timeout(15_000) });
if (!yamlResponse.ok) throw new Error(`Could not fetch the public miner.yaml (HTTP ${yamlResponse.status}).`);
const yaml = await yamlResponse.text();
const endpointIntentsLine = yaml.match(/^\\s+intents:\\s*\\[([^\\]]+)\\]\\s*$/m)?.[1];
if (!endpointIntentsLine) throw new Error("Could not read endpoint intents from miner.yaml.");
const expectedIntents = endpointIntentsLine.split(",").map(value => value.trim()).filter(Boolean);
if (expectedIntents.length !== 29 || new Set(expectedIntents).size !== expectedIntents.length) {
  throw new Error(`Expected 29 unique endpoint intents in miner.yaml; found ${expectedIntents.length}.`);
}
const response = await fetch(new URL("/api/miners", baseUrl), {
  headers: { accept: "application/json" },
  signal: AbortSignal.timeout(15_000)
});
if (!response.ok) throw new Error(`Telegraph miner catalogue returned HTTP ${response.status}.`);
const payload = await response.json();
const miners = Array.isArray(payload) ? payload :
  Array.isArray(payload?.miners) ? payload.miners :
  Array.isArray(payload?.data) ? payload.data : null;
if (!miners) throw new Error("Unexpected Telegraph miner catalogue response shape.");
const miner = miners.find(item => item && typeof item === "object" &&
  (item.slug === expectedSlug || item.name === expectedSlug));
if (!miner) {
  throw new Error(`Miner slug "${expectedSlug}" is not present in this node's active miner catalogue. Do not infer a registration ID; inspect the registration-specific endpoint using the actual registration receipt/ID.`);
}
const status = typeof miner.activation_status === "string" ? miner.activation_status :
  typeof miner.status === "string" ? miner.status : "listed (status field not supplied)";
if (status !== "active" && status !== "listed (status field not supplied)") {
  throw new Error(`Miner "${expectedSlug}" is listed but not active: ${status}`);
}
const registryIntents = miner.supported_intents ?? miner.intents ?? null;
let intentParity = "registry does not expose a supported-intent array; compare registration receipt/dashboard/Explorer";
if (Array.isArray(registryIntents)) {
  const actual = [...new Set(registryIntents)].sort();
  const expected = [...expectedIntents].sort();
  const missing = expected.filter(intent => !actual.includes(intent));
  const extra = actual.filter(intent => !expected.includes(intent));
  intentParity = missing.length === 0 && extra.length === 0 ? "match" : "mismatch";
  if (intentParity === "mismatch") {
    throw new Error(`Live registry intent mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
  }
}
console.log(JSON.stringify({
  node: baseUrl,
  slug: miner.slug ?? expectedSlug,
  id: miner.id ?? miner.miner_id ?? null,
  activation_status: status,
  expected_intent_count: expectedIntents.length,
  supported_intents_reported_by_registry: registryIntents,
  intent_parity: intentParity,
  limitation: "Catalogue presence is not proof of the exact on-chain registration unless the node exposes the registered intent array. If unavailable, compare the actual registration receipt and Explorer after indexing."
}, null, 2));
