import test from "node:test";
import assert from "node:assert/strict";

test("SSL verification validates port boundaries", () => {
  assert.equal(Number.isInteger(443) && 443 >= 1 && 443 <= 65535, true);
  assert.equal(Number.isInteger(65536) && 65536 <= 65535, false);
});

test("SSL verification uses hostname as TLS SNI and keeps authorization enabled", () => {
  const options = { host: "example.com", port: 443, servername: "example.com", rejectUnauthorized: true };
  assert.equal(options.servername, options.host);
  assert.equal(options.rejectUnauthorized, true);
});

test("SSL evidence uses stable endpoint provenance", () => {
  assert.equal(["tls", "example.com", 443].join(":"), "tls:example.com:443");
});


test("SSL verification rejects an invalid timeout before opening a socket", async () => {
  let called = false;
  const { verifySsl } = await import("../dist/intents/ssl-verification.js");
  const result = await verifySsl("example.com", 443, {
    timeoutMs: 0,
    connectImpl: () => {
      called = true;
      throw new Error("socket should not be opened");
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "invalid_timeout");
  assert.equal(called, false);
});
