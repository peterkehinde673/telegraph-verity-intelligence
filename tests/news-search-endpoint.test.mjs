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

test("search intents are reachable through the real POST /v1/intent route", async () => {
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

    const webResponse = await fetch(`http://127.0.0.1:${port}/v1/intent`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: "WEB_SEARCH", input: { query: "current climate policy" } })
    });
    assert.equal(webResponse.status, 200);
    const webResult = await webResponse.json();
    assert.match(webResult.retrieved_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    delete webResult.retrieved_at;
    assert.deepEqual(webResult, {
      intent: "WEB_SEARCH",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { query: "current climate policy", results: [] },
      evidence: [],
      uncertainty: [{
        code: "web_search_source_unconfigured",
        message: "A Jina Search API key is required to search the web in this deployment."
      }]
    });

    const twitterResponse = await fetch(`http://127.0.0.1:${port}/v1/intent`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: "TWITTER_SEARCH", input: { query: "public posts" } })
    });
    assert.equal(twitterResponse.status, 200);
    const twitterResult = await twitterResponse.json();
    assert.match(twitterResult.retrieved_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    delete twitterResult.retrieved_at;
    assert.deepEqual(twitterResult, {
      intent: "TWITTER_SEARCH",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { query: "public posts", results: [] },
      evidence: [],
      uncertainty: [{
        code: "twitter_search_source_unconfigured",
        message: "An X API bearer token is required to search public X posts in this deployment."
      }]
    });

    const sentimentResponse = await fetch(`http://127.0.0.1:${port}/v1/intent`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: "SENTIMENT_ANALYSIS", input: { text: "This is a pleasant experience." } })
    });
    assert.equal(sentimentResponse.status, 200);
    const sentimentResult = await sentimentResponse.json();
    assert.match(sentimentResult.retrieved_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    delete sentimentResult.retrieved_at;
    assert.deepEqual(sentimentResult, {
      intent: "SENTIMENT_ANALYSIS",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { text: "This is a pleasant experience.", sentiment: null },
      evidence: [],
      uncertainty: [{
        code: "sentiment_source_unconfigured",
        message: "A Hugging Face Inference Providers token is required to classify text in this deployment."
      }]
    });
  } finally {
    if (child.exitCode === null) {
      const exitPromise = new Promise(resolve => child.once("exit", resolve));
      child.kill("SIGTERM");
      await exitPromise;
    }
  }
});
