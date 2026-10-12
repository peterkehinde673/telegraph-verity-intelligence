#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "miner.yaml.template";
const yaml = await readFile(file, "utf8");
const expectedPlaceholder = 'id: "REPLACE_WITH_VERIFIED_UNUSED_MINER_ID"';

if (!yaml.includes(expectedPlaceholder)) {
  throw new Error("Miner template must retain the verified-unused-ID placeholder; do not treat it as registration-ready.");
}

if (!yaml.includes("base_url: https://telegraph-verity-intelligence-api.onrender.com")) {
  throw new Error("Expected live Render base_url is missing.");
}

if (!yaml.includes("endpoints:")) {
  throw new Error("Miner template has no endpoints block.");
}

console.log("Miner template preflight passed.");
