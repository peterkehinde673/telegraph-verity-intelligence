import test from "node:test";
import assert from "node:assert/strict";
import { verifyCodePatch } from "../dist/intents/code-patch-verify.js";

test("CODE_PATCH_VERIFY reports successful GitHub CI checks with evidence", async () => {
  const result = await verifyCodePatch({ repository: "owner/project", commit_sha: "a".repeat(40) }, {
    now: () => "2026-10-12T00:00:00.000Z",
    fetchImpl: async (url, init) => {
      assert.match(String(url), /^https:\/\/api\.github\.com\/repos\/owner\/project\/commits\//);
      assert.equal(init.method, "GET");
      return new Response(JSON.stringify({ check_runs: [
        { name: "tests", status: "completed", conclusion: "success", html_url: "https://github.com/owner/project/actions/runs/1" },
        { name: "build", status: "completed", conclusion: "success", html_url: "https://github.com/owner/project/actions/runs/2" }
      ] }), { status: 200 });
    }
  });
  assert.equal(result.intent, "CODE_PATCH_VERIFY");
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.successful, 2);
  assert.equal(result.evidence.length, 2);
});

test("CODE_PATCH_VERIFY distinguishes pending checks and rejects invalid identifiers", async () => {
  const pending = await verifyCodePatch({ repository: "owner/project", commit_sha: "abcdef0" }, {
    fetchImpl: async () => new Response(JSON.stringify({ check_runs: [
      { name: "tests", status: "in_progress", conclusion: null }
    ] }), { status: 200 })
  });
  const invalid = await verifyCodePatch({ repository: "https://evil.example", commit_sha: "not-a-sha" });
  assert.equal(pending.verdict, "uncertain");
  assert.equal(pending.answer.pending, 1);
  assert.equal(invalid.verdict, "rejected");
});
