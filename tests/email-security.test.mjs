import test from "node:test";
import assert from "node:assert/strict";
import { checkEmailSecurity } from "../dist/intents/email-security.js";

test("email security evaluates MX, SPF, and DMARC evidence", async () => {
  const result = await checkEmailSecurity("Example.COM.", {
    resolveImpl: async (name, type) => {
      if (name === "example.com" && type === "MX") {
        return [{ exchange: "mail.example.com", priority: 10 }];
      }
      if (name === "example.com" && type === "TXT") {
        return [["v=spf1 include:mail.example.com -all"]];
      }
      if (name === "_dmarc.example.com" && type === "TXT") {
        return [["v=DMARC1; p=reject; rua=mailto:dmarc@example.com"]];
      }
      throw Object.assign(new Error("ENODATA"), { code: "ENODATA" });
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


test("email security abstains on transient SPF TXT resolver failures instead of reporting SPF missing", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (name, type) => {
      if (name === "example.com" && type === "MX") {
        return [{ exchange: "mail.example.com", priority: 10 }];
      }
      if (name === "example.com" && type === "TXT") {
        throw Object.assign(new Error("temporary resolver failure"), { code: "EAI_AGAIN" });
      }
      if (name === "_dmarc.example.com" && type === "TXT") {
        return [["v=DMARC1; p=reject"]];
      }
      throw Object.assign(new Error("no data"), { code: "ENODATA" });
    },
    now: () => "2026-10-17T00:00:00.000Z"
  });

  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "dns_lookup_failed");
  assert.deepEqual(result.evidence, []);
  assert.equal(result.answer.spf_present, false);
  assert.equal(result.answer.dmarc_present, false);
});

test("email security still treats ENODATA for SPF and DMARC TXT as absence", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (name, type) => {
      if (type === "MX") return [{ exchange: "mail.example.com", priority: 10 }];
      throw Object.assign(new Error("no data"), { code: "ENODATA" });
    }
  });

  assert.equal(result.verdict, "uncertain");
  assert.equal(result.uncertainty.some((item) => item.code === "spf_missing"), true);
  assert.equal(result.uncertainty.some((item) => item.code === "dmarc_missing"), true);
});


test("email security does not expose raw DNS resolver errors", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (_name, type) => {
      if (type === "MX") {
        throw new Error("private resolver https://dns.internal/?token=secret-email-88");
      }
      return [];
    },
    now: () => "2026-10-17T00:00:00.000Z"
  });

  assert.equal(result.intent, "EMAIL_SECURITY");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "dns_lookup_failed");
  assert.equal(
    result.uncertainty[0]?.message,
    "The domain DNS records could not be retrieved because the lookup failed."
  );
  assert.equal(result.uncertainty[0]?.message.includes("secret-email-88"), false);
  assert.deepEqual(result.evidence, []);
});


test("email security treats ENOTFOUND on optional TXT lookup as DNS failure, not missing policy", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (name, type) => {
      if (type === "MX") return [{ exchange: "mail.example.com", priority: 10 }];
      if (name === "example.com" && type === "TXT") {
        return [["v=spf1 -all"]];
      }
      if (name === "_dmarc.example.com" && type === "TXT") {
        throw Object.assign(new Error("DNS name does not exist"), { code: "ENOTFOUND" });
      }
      throw Object.assign(new Error("no data"), { code: "ENODATA" });
    },
    now: () => "2026-10-17T00:00:00.000Z"
  });

  assert.equal(result.intent, "EMAIL_SECURITY");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "dns_lookup_failed");
  assert.deepEqual(result.evidence, []);
});


test("email security abstains when DNS provider returns malformed MX records", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (_name, type) => {
      if (type === "MX") return [{ exchange: "", priority: "high" }];
      return [["v=spf1 -all"]];
    },
    now: () => "2026-10-18T00:00:00.000Z"
  });

  assert.equal(result.intent, "EMAIL_SECURITY");
  assert.equal(result.verdict, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.equal(result.uncertainty[0]?.code, "invalid_dns_response");
  assert.deepEqual(result.evidence, []);
  assert.deepEqual(result.answer.mx_records, []);
});


test("email security flags multiple SPF and DMARC policy records as misconfiguration", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (name, type) => {
      if (type === "MX") return [{ exchange: "mail.example.com", priority: 10 }];
      if (name === "example.com" && type === "TXT") {
        return [
          ["v=spf1 -all"],
          ["v=spf1 include:mail.example.com -all"]
        ];
      }
      if (name === "_dmarc.example.com" && type === "TXT") {
        return [
          ["v=DMARC1; p=reject"],
          ["v=DMARC1; p=none"]
        ];
      }
      throw Object.assign(new Error("no data"), { code: "ENODATA" });
    },
    now: () => "2026-10-18T00:00:00.000Z"
  });

  assert.equal(result.verdict, "uncertain");
  assert.equal(result.answer.spf_records.length, 2);
  assert.equal(result.answer.dmarc_records.length, 2);
  assert.equal(result.uncertainty.some((item) => item.code === "spf_multiple_records"), true);
  assert.equal(result.uncertainty.some((item) => item.code === "dmarc_multiple_records"), true);
});


test("email security does not confirm a DMARC record without a recognized policy", async () => {
  const result = await checkEmailSecurity("example.com", {
    resolveImpl: async (name, type) => {
      if (type === "MX") return [{ exchange: "mail.example.com", priority: 10 }];
      if (name === "example.com" && type === "TXT") return [["v=spf1 -all"]];
      if (name === "_dmarc.example.com" && type === "TXT") return [["v=DMARC1; rua=mailto:dmarc@example.com"]];
      throw Object.assign(new Error("no data"), { code: "ENODATA" });
    },
    now: () => "2026-10-18T00:00:00.000Z"
  });

  assert.equal(result.verdict, "uncertain");
  assert.equal(result.answer.dmarc_present, true);
  assert.equal(result.answer.dmarc_policy, "unknown");
  assert.equal(result.uncertainty.some((item) => item.code === "dmarc_policy_invalid"), true);
});
