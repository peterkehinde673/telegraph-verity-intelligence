import test from "node:test";
import assert from "node:assert/strict";
import { checkEmailSecurity } from "../dist/intents/email-security.js";

test("email security normalizes MX, SPF and DMARC records", async () => {
  const result = await checkEmailSecurity("Example.COM.", {
    resolveImpl: async (name, type) => {
      if (type === "MX") return [{ exchange: "mail.example.com", priority: 10 }];
      if (name.startsWith("_dmarc.")) return [["v=DMARC1; p=reject; rua=mailto:security@example.com"]];
      return [["v=spf1 include:_spf.example.com -all"], ["google-site-verification=test"]];
    },
    now: () => "2026-10-07T00:00:00.000Z"
  });
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.domain, "example.com");
  assert.equal(result.answer.spf_present, true);
  assert.equal(result.answer.dmarc_policy, "reject");
  assert.deepEqual(result.answer.mx_records, [{ exchange: "mail.example.com", priority: 10 }]);
});

test("email security reports missing SPF and DMARC as uncertainty", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (_name, type) => type === "MX" ? [{ exchange: "mail.example.com", priority: 10 }] : []
  });
  assert.equal(result.verdict, "uncertain");
  assert.equal(result.answer.spf_present, false);
  assert.equal(result.answer.dmarc_present, false);
  assert.equal(result.uncertainty.some((item) => item.code === "spf_missing"), true);
  assert.equal(result.uncertainty.some((item) => item.code === "dmarc_missing"), true);
});

test("email security abstains when DNS resolution fails", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async () => { throw new Error("resolver unavailable"); }
  });
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "dns_lookup_failed");
});
