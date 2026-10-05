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
