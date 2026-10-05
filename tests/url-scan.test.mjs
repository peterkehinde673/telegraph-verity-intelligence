import test from "node:test";
import assert from "node:assert/strict";
import { scanUrl } from "../dist/intents/url-scan.js";

test("URL scan rejects unsupported schemes before network access", async () => {
  let called = false;
  const result = await scanUrl("file:///etc/passwd", {
    fetchImpl: async () => {
      called = true;
      throw new Error("network should not be called");
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "unsupported_scheme");
  assert.equal(called, false);
});

test("URL scan records a successful HTTP response", async () => {
  const result = await scanUrl("https://example.com", {
    lookupImpl: async () => [{ address: "93.184.216.34", family: 4 }],
    fetchImpl: async () => new Response("ok", {
      status: 200,
      headers: { "content-type": "text/html" }
    }),
    now: () => "2026-10-04T17:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.status_code, 200);
  assert.equal(result.answer.content_type, "text/html");
  assert.equal(result.answer.redirect_count, 0);
});

test("URL scan blocks private IPv4 targets", async () => {
  const result = await scanUrl("http://127.0.0.1", {
    now: () => "2026-10-04T17:00:00.000Z"
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "non_public_target");
});

test("URL scan follows an HTTP redirect under the configured limit", async () => {
  const seen = [];
  const result = await scanUrl("https://example.com/start", {
    lookupImpl: async () => [{ address: "93.184.216.34", family: 4 }],
    fetchImpl: async (url) => {
      seen.push(url.toString());
      if (seen.length === 1) {
        return new Response(null, { status: 302, headers: { location: "/final" } });
      }
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain" } });
    },
    now: () => "2026-10-04T17:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.redirect_count, 1);
  assert.equal(result.answer.final_url, "https://example.com/final");
});
