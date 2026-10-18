import test from "node:test";
import assert from "node:assert/strict";
import { verifyRegression } from "../dist/intents/regression-verify.js";

test("REGRESSION_VERIFY executes allowlisted HTTPS GET checks and assertions", async () => {
  const calls = [];
  const result = await verifyRegression({
    base_url: "https://service.example",
    checks: [
      { name: "health", path: "/health", expected_status: 200, json_path: "status", equals: "ok" },
      { name: "missing", path: "/missing", expected_status: 200 }
    ]
  }, {
    allowedHosts: ["service.example"],
    now: () => "2026-10-12T00:00:00.000Z",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), method: init.method, redirect: init.redirect });
      if (String(url).endsWith("/health")) return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      return new Response("not found", { status: 404 });
    }
  });

  assert.equal(result.intent, "REGRESSION_VERIFY");
  assert.equal(result.answer.checks_run, 2);
  assert.equal(result.answer.passed, 1);
  assert.equal(result.answer.failed, 1);
  assert.equal(result.answer.results[0].status, "passed");
  assert.equal(result.answer.results[1].status, "failed");
  assert.ok(calls.every(c => c.method === "GET" && c.redirect === "manual"));
});

test("REGRESSION_VERIFY rejects non-allowlisted hosts and missing configuration", async () => {
  const rejected = await verifyRegression({
    base_url: "https://evil.example",
    checks: [{ path: "/health" }]
  }, { allowedHosts: ["service.example"] });
  const missing = await verifyRegression({ base_url: "https://service.example", checks: [{ path: "/health" }] }, { allowedHosts: [] });
  assert.equal(rejected.verdict, "rejected");
  assert.equal(rejected.uncertainty[0].code, "base_url_not_allowlisted");
  assert.equal(missing.verdict, "insufficient_evidence");
});

test("REGRESSION_VERIFY rejects redirecting paths and malformed check plans", async () => {
  const result = await verifyRegression({
    base_url: "https://service.example",
    checks: [{ path: "//other.example/steal" }]
  }, { allowedHosts: ["service.example"] });
  assert.equal(result.verdict, "rejected");
});


test("REGRESSION_VERIFY rejects JSON assertions without an expected value", async () => {
  const result = await verifyRegression({
    base_url: "https://service.example",
    checks: [{ path: "/health", json_path: "status" }]
  }, { allowedHosts: ["service.example"] });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0].code, "invalid_checks");
});
