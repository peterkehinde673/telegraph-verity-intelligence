import test from "node:test";
import assert from "node:assert/strict";
import { checkEmailSecurity } from "../dist/intents/email-security.js";

test("email security evaluates MX, SPF, and DMARC evidence", async () => {
  const records = {
    "example.com": { MX: [{ exchange: "mail.example.com", priority: 10 }], TXT: ["v=spf1 include:mail.example.com -all"] },
    "_dmarc.example.com": { TXT: ["v=DMARC1; p=reject; rua=mailto:dmarc@example.com"] }
  };

  const result = await checkEmailSecurity("Example.COM.", {
    resolveImpl: async (name, type) => {
      const value = records[name]?.[type];
      if (value === undefined) throw Object.assign(new Error("ENODATA"), { code: "ENODATA" });
      return value;
    },
    now: () => "2026-10-05T05:00:00.000Z"
  });

  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.domain, "example.com");
  assert.equal(result.answer.spf_present, true);
  assert.equal(result.answer.dmarc_policy, "reject");
  assert.equal(result.answer.mx_records[0]?.priority, 10);
});

test("email security reports missing SPF and DMARC as uncertainty", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (name, type) => {
      if (type === "MX") return [{ exchange: "mail.example.com", priority: 10 }];
      throw Object.assign(new Error("ENODATA"), { code: "ENODATA" });
    }
  });

  assert.equal(result.verdict, "uncertain");
  assert.equal(result.uncertainty.some((item) => item.code === "spf_missing"), true);
  assert.equal(result.uncertainty.some((item) => item.code === "dmarc_missing"), true);
});

test("email security rejects an email address instead of a domain", async () => {
  const result = await checkEmailSecurity("user@example.com");
  assert.equal(result.verdict, "rejected");
  assert.equal(result.uncertainty[0]?.code, "invalid_domain");
});
