#!/usr/bin/env node
const baseUrl = process.env.TELEGRAPH_NODE_URL ?? "https://devnode.telegraphprotocol.com";
const expectedSlug = process.env.TELEGRAPH_MINER_SLUG ?? "telegraph-verity-intelligence";
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
console.log(JSON.stringify({
  node: baseUrl,
  slug: miner.slug ?? expectedSlug,
  id: miner.id ?? miner.miner_id ?? null,
  activation_status: status,
  supported_intents: miner.supported_intents ?? miner.intents ?? null
}, null, 2));
