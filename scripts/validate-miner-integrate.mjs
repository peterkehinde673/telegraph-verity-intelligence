#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const yaml = await readFile(new URL("../miner.yaml", import.meta.url), "utf8");
const response = await fetch("https://integrate.telegraphprotocol.com/api/validate", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ yaml }),
  signal: AbortSignal.timeout(30_000)
});
const raw = await response.text();
let result;
try { result = JSON.parse(raw); } catch {
  throw new Error(`Integrate validation returned non-JSON (HTTP ${response.status}).`);
}
console.log(JSON.stringify({
  endpoint: "https://integrate.telegraphprotocol.com/api/validate",
  http_status: response.status,
  valid: result.valid,
  slug: result.slug,
  name: result.name,
  errors: result.errors ?? [],
  warnings: result.warnings ?? [],
  conflicts: result.conflicts ?? [],
  results: Array.isArray(result.results) ? result.results.map(item => ({
    path: item.path, method: item.method, status: item.status,
    success: item.success, latency_ms: item.latency_ms,
    error: item.error
  })) : undefined
}, null, 2));
if (!response.ok || result.valid !== true) {
  throw new Error("Current miner.yaml did not pass Telegraph Integrate's live validator. Review the validation output before updating the on-chain registration.");
}
if (Array.isArray(result.results) && result.results.some(item => item.success !== true)) {
  throw new Error("One or more miner endpoints failed Telegraph Integrate's live sandbox test.");
}
