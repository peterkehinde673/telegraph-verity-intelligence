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


test("URL scan rejects invalid network limits before access", async () => {
  let called = false;
  const result = await scanUrl("https://example.com", {
    timeoutMs: 0,
    fetchImpl: async () => {
      called = true;
      throw new Error("network should not be called");
    },
    lookupImpl: async () => [{ address: "93.184.216.34", family: 4 }]
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "invalid_timeout");
  assert.equal(called, false);
});

test("URL scan rejects an excessive redirect limit", async () => {
  const result = await scanUrl("https://example.com", {
    maxRedirects: 21
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "invalid_redirect_limit");
});


test("URL scan blocks IPv4-mapped IPv6 loopback targets", async () => {
  const result = await scanUrl("http://[::ffff:7f00:1]/", {
    fetchImpl: async () => { throw new Error("network must not be called"); }
  });
  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "non_public_target");
});

test("URL scan blocks reserved documentation IPv4 targets", async () => {
  const result = await scanUrl("http://192.0.2.10/", {
    fetchImpl: async () => { throw new Error("network must not be called"); }
  });
  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "non_public_target");
});

test("URL scan blocks a hostname if any resolved answer is non-public", async () => {
  let called = false;
  const result = await scanUrl("https://mixed.example/", {
    lookupImpl: async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.8", family: 4 }
    ],
    fetchImpl: async () => {
      called = true;
      return new Response("should not happen", { status: 200 });
    }
  });
  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "non_public_target");
  assert.equal(called, false);
});


test("URL scan accepts a globally routable IPv6 literal after removing URL brackets", async () => {
  const result = await scanUrl("https://[2606:4700:4700::1111]/", {
    fetchImpl: async () => new Response("ok", { status: 200 })
  });
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.status_code, 200);
});

test("URL scan blocks unique-local IPv6 targets", async () => {
  const result = await scanUrl("https://[fd12:3456::1]/", {
    fetchImpl: async () => { throw new Error("network must not be called"); }
  });
  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "non_public_target");
});
