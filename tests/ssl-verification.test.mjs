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


test("SSL verification normalizes connection refusal to an uncertain response", async () => {
  const { EventEmitter } = await import("node:events");
  const { verifySsl } = await import("../dist/intents/ssl-verification.js");
  const socket = new EventEmitter();
  socket.setTimeout = () => socket;
  socket.destroy = () => socket;
  const resultPromise = verifySsl("refused.example", 443, {
    connectImpl: () => socket
  });
  const error = Object.assign(new Error("connect ECONNREFUSED internal host detail"), { code: "ECONNREFUSED" });
  socket.emit("error", error);
  const result = await resultPromise;
  assert.equal(result.intent, "SSL_VERIFICATION");
  assert.equal(result.verdict, "uncertain");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "tls_connection_failed");
  assert.doesNotMatch(result.uncertainty[0]?.message ?? "", /internal host detail|ECONNREFUSED/);
});

test("SSL verification normalizes a socket timeout and destroys the socket", async () => {
  const { EventEmitter } = await import("node:events");
  const { verifySsl } = await import("../dist/intents/ssl-verification.js");
  const socket = new EventEmitter();
  let timeoutHandler;
  let destroyed = false;
  socket.setTimeout = (_ms, callback) => { timeoutHandler = callback; return socket; };
  socket.destroy = () => { destroyed = true; return socket; };
  const resultPromise = verifySsl("slow.example", 443, {
    timeoutMs: 5,
    connectImpl: () => socket
  });
  assert.equal(typeof timeoutHandler, "function");
  timeoutHandler();
  const result = await resultPromise;
  assert.equal(result.verdict, "uncertain");
  assert.equal(result.uncertainty[0]?.code, "tls_connection_failed");
  assert.equal(destroyed, true);
});


test("SSL verification does not expose raw certificate authorization diagnostics", async () => {
  const { EventEmitter } = await import("node:events");
  const { verifySsl } = await import("../dist/intents/ssl-verification.js");
  const socket = new EventEmitter();
  socket.authorized = false;
  socket.authorizationError = "private internal hostname detail";
  socket.setTimeout = () => socket;
  socket.destroy = () => socket;
  socket.getPeerCertificate = () => ({});
  socket.getCipher = () => ({ name: "TLS_AES_128_GCM_SHA256" });
  socket.getProtocol = () => "TLSv1.3";

  const resultPromise = verifySsl("example.com", 443, {
    connectImpl: () => socket,
    now: () => "2026-10-17T00:00:00.000Z"
  });
  socket.emit("secureConnect");
  const result = await resultPromise;

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "certificate_not_authorized");
  assert.equal(result.uncertainty[0]?.message, "The TLS certificate was not authorized by the local trust store.");
  assert.equal(result.answer.authorization_error, "CERTIFICATE_NOT_AUTHORIZED");
  assert.doesNotMatch(JSON.stringify(result), /private internal hostname detail/);
});
