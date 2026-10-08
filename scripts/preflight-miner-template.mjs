#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "miner.yaml.template";
const yaml = await readFile(file, "utf8");

const forbidden = [
  'id: "REPLACE_WITH_VERIFIED_UNUSED_MINER_ID"',
  "id: 0",
  "id: 501"
];

const found = forbidden.filter((value) => yaml.includes(value));
if (found.length > 0) {
  console.log("Template preflight: no registrable Miner ID is present (expected).");
} else {
  throw new Error(
    "Template preflight expected the registration ID placeholder. Refusing to treat the template as registration-ready."
  );
}

if (!yaml.includes("base_url: https://telegraph-verity-intelligence-api.onrender.com")) {
  throw new Error("Expected live Render base_url is missing.");
}

if (!yaml.includes("endpoints:")) {
  throw new Error("Miner template has no endpoints block.");
}

console.log("Miner template preflight passed.");
