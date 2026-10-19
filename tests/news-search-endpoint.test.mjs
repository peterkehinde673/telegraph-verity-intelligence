import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer as createTcpServer } from "node:net";

async function unusedPort() {
  const server = createTcpServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return address.port;
}

test("NEWS_SEARCH is reachable through the real POST /v1/intent route", async () => {
  const port = await unusedPort();
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: process.cwd(),
    env: { PATH: process.env.PATH ?? "", PORT: String(port), NODE_ENV: "test" },
    stdio: "ignore"
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (child.exitCode !== null) break;
      try {
        const health = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(250) });
        if (health.ok) {
          ready = true;
          break;
        }
      } catch {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    assert.equal(ready, true, "server should become healthy before the request");

    const response = await fetch(`http://127.0.0.1:${port}/v1/intent`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: "NEWS_SEARCH", input: { query: "   " } })
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
    const result = await response.json();
    assert.match(result.retrieved_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    delete result.retrieved_at;
    assert.deepEqual(result, {
      intent: "NEWS_SEARCH",
      verdict: "rejected",
      confidence: 1,
      answer: { query: "", results: [] },
      evidence: [],
      uncertainty: [{ code: "empty_query", message: "A news search query is required." }]
    });
  } finally {
    if (child.exitCode === null) {
      const exitPromise = new Promise(resolve => child.once("exit", resolve));
      child.kill("SIGTERM");
      await exitPromise;
    }
  }
});
