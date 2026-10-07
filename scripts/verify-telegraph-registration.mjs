#!/usr/bin/env node
import { VERITY_INTENTS } from "../dist/intents/catalogue.js";

const INTENTS_URL = "https://devnode.telegraphprotocol.com/engine/v1/intents";
const MINERS_URL = "https://devnode.telegraphprotocol.com/api/miners";

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

const canonical = await fetchJson(INTENTS_URL);
const canonicalEntries =
  Array.isArray(canonical) ? canonical :
  Array.isArray(canonical?.intents) ? canonical.intents :
  Array.isArray(canonical?.data) ? canonical.data :
  Array.isArray(canonical?.items) ? canonical.items :
  [];

const canonicalNames = new Set(
  canonicalEntries
    .map((item) => typeof item === "string" ? item : item?.name ?? item?.intent ?? item?.intent_name)
    .filter((name) => typeof name === "string")
);

const missing = VERITY_INTENTS.filter((intent) => !canonicalNames.has(intent));
if (missing.length > 0) {
  console.error("Non-canonical Verity Intents:", missing.join(", "));
  process.exit(1);
}

console.log(`All ${VERITY_INTENTS.length} Verity Intents are present in the live canonical set.`);

if (process.argv[2]) {
  const requestedId = Number(process.argv[2]);
  if (!Number.isSafeInteger(requestedId) || requestedId < 0) {
    throw new Error("Miner ID must be a non-negative integer.");
  }

  const miners = await fetchJson(MINERS_URL);
  const entries = Array.isArray(miners) ? miners : miners?.miners;
  if (!Array.isArray(entries)) throw new Error("Unexpected miner catalogue response.");
  const used = entries.some((miner) => Number(miner?.id ?? miner?.miner_id) === requestedId);
  if (used) {
    console.error(`Miner ID ${requestedId} is already registered. Choose another ID only after verifying the live catalogue.`);
    process.exit(1);
  }
  console.log(`Miner ID ${requestedId} is currently unused according to the live catalogue.`);
}
