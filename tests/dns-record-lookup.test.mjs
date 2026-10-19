import test from "node:test";
import assert from "node:assert/strict";
import { lookupDnsRecord } from "../dist/intents/dns-record-lookup.js";

test("DNS lookup normalizes the hostname and returns records", async () => {
  const result = await lookupDnsRecord("Example.COM.", "A", {
    resolveImpl: async (hostname, type) => {
      assert.equal(hostname, "example.com");
      assert.equal(type, "A");
      return ["192.0.2.10"];
    },
    now: () => "2026-10-04T17:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.deepEqual(result.answer.records, ["192.0.2.10"]);
  assert.equal(result.answer.hostname, "example.com");
  assert.equal(result.evidence[0]?.source_id, "dns:example.com:A");
});

test("DNS lookup returns not_found for ENODATA", async () => {
  const result = await lookupDnsRecord("missing.example", "A", {
    resolveImpl: async () => {
      const error = new Error("no data");
      Object.assign(error, { code: "ENODATA" });
      throw error;
    },
    now: () => "2026-10-04T17:00:00.000Z"
  });

  assert.equal(result.verdict, "not_found");
  assert.deepEqual(result.answer.records, []);
  assert.equal(result.evidence[0]?.source_type, "dns");
});

test("DNS lookup rejects unsupported record types", async () => {
  const result = await lookupDnsRecord("example.com", "INVALID", {
    now: () => "2026-10-04T17:00:00.000Z"
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "unsupported_record_type");
});


test("DNS lookup rejects malformed hostnames before resolver access", async () => {
  let called = false;
  const result = await lookupDnsRecord("bad..example.com", "A", {
    resolveImpl: async () => {
      called = true;
      return [];
    }
  });

  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "invalid_hostname");
  assert.equal(called, false);
});


test("DNS lookup returns insufficient evidence for transient resolver failures", async () => {
  const result = await lookupDnsRecord("example.com", "A", {
    resolveImpl: async () => {
      throw Object.assign(new Error("temporary resolver outage"), { code: "EAI_AGAIN" });
    },
    now: () => "2026-10-17T00:00:00.000Z"
  });

  assert.equal(result.intent, "DNS_RECORD_LOOKUP");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.deepEqual(result.answer.records, []);
  assert.deepEqual(result.evidence, []);
  assert.equal(result.uncertainty[0]?.code, "dns_lookup_failed");
  assert.equal(result.uncertainty[0]?.message.includes("temporary resolver outage"), false);
  assert.equal(result.retrieved_at, "2026-10-17T00:00:00.000Z");
});
