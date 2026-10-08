#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "miner.yaml";
const apiKey = process.env.TELEGRAPH_VALIDATION_API_KEY;
const minerAddress = process.env.TELEGRAPH_MINER_ADDRESS;

const yaml = await readFile(file, "utf8");

const body = {
  yaml,
  ...(apiKey ? { api_key: apiKey } : {}),
  ...(minerAddress ? { miner_address: minerAddress } : {})
};

const response = await fetch("https://integrate.telegraphprotocol.com/api/validate", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify(body)
});

const result = await response.json();
console.log(JSON.stringify(result, null, 2));

if (!response.ok || result.valid !== true) {
  process.exit(1);
}

const failed = Array.isArray(result.results)
  ? result.results.filter((entry) => entry.success !== true || (typeof entry.status === "number" && (entry.status < 200 || entry.status >= 300)))
  : [];

if (failed.length > 0) {
  console.error("One or more miner endpoints did not return a 2xx validation response.");
  for (const entry of failed) console.error(JSON.stringify(entry));
  process.exit(1);
}

console.log("Telegraph miner validation passed with all declared endpoints returning 2xx.");
