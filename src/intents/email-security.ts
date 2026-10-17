import { promises as dns } from "node:dns";
import { domainToASCII } from "node:url";
import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface EmailSecurityAnswer {
  domain: string;
  mx_records: Array<{ exchange: string; priority: number }>;
  spf_present: boolean;
  spf_records: string[];
  dmarc_present: boolean;
  dmarc_records: string[];
  dmarc_policy?: "none" | "quarantine" | "reject" | "unknown";
}

export interface EmailSecurityOptions {
  resolveImpl?: typeof dns.resolve;
  now?: () => string;
}

async function resolveTxt(resolve: typeof dns.resolve, name: string): Promise<string[]> {
  const records: unknown = await resolve(name, "TXT");
  if (
    !Array.isArray(records) ||
    !records.every((record) => Array.isArray(record) && record.every((part) => typeof part === "string"))
  ) {
    throw Object.assign(new Error("Malformed TXT response"), { code: "INVALID_DNS_RESPONSE" });
  }
  return records.map((record: string[]) => record.join(""));
}

async function resolveOptionalTxt(resolve: typeof dns.resolve, name: string): Promise<string[]> {
  try {
    return await resolveTxt(resolve, name);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
    // A missing TXT RRset is evidence of absence; resolver outages are not.
    if (code === "ENODATA") return [];
    throw error;
  }
}

export async function checkEmailSecurity(
  domain: string,
  options: EmailSecurityOptions = {}
): Promise<VerityResponse<EmailSecurityAnswer>> {
  const inputDomain = domain.trim().toLowerCase().replace(/\.$/, "");
  const normalizedDomain = domainToASCII(inputDomain);
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const resolve = options.resolveImpl ?? dns.resolve;

  const labels = normalizedDomain.split(".");
  const validDomain = normalizedDomain.length <= 253 && labels.length >= 2 && labels.every((label) => label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));

  if (!validDomain || normalizedDomain.includes("@") || normalizedDomain.includes(" ")) {
    return {
      intent: "EMAIL_SECURITY",
      verdict: "rejected",
      confidence: 1,
      answer: { domain: normalizedDomain, mx_records: [], spf_present: false, spf_records: [], dmarc_present: false, dmarc_records: [] },
      evidence: [],
      uncertainty: [{ code: "invalid_domain", message: "A domain name is required, not an email address." }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const [mx, spf, dmarc] = await Promise.all([
      resolve(normalizedDomain, "MX") as Promise<Array<{ exchange: string; priority: number }>>,
      resolveOptionalTxt(resolve, normalizedDomain),
      resolveOptionalTxt(resolve, "_dmarc." + normalizedDomain)
    ]);

    if (
      !Array.isArray(mx) ||
      !mx.every((record) =>
        record !== null &&
        typeof record === "object" &&
        typeof record.exchange === "string" &&
        record.exchange.trim().length > 0 &&
        Number.isInteger(record.priority) &&
        record.priority >= 0 &&
        record.priority <= 65535
      ) ||
      !Array.isArray(spf) ||
      !spf.every((record) => typeof record === "string") ||
      !Array.isArray(dmarc) ||
      !dmarc.every((record) => typeof record === "string")
    ) {
      return {
        intent: "EMAIL_SECURITY",
        verdict: "insufficient_evidence",
        confidence: 0,
        answer: { domain: normalizedDomain, mx_records: [], spf_present: false, spf_records: [], dmarc_present: false, dmarc_records: [] },
        evidence: [],
        uncertainty: [{
          code: "invalid_dns_response",
          message: "The domain DNS service returned records in an invalid format."
        }],
        retrieved_at: retrievedAt
      };
    }

    const spfRecords = spf.filter((record) => /^v=spf1(?:\s|$)/i.test(record));
    const dmarcRecords = dmarc.filter((record) => /^v=dmarc1(?:[;\s]|$)/i.test(record));
    const dmarcRecord = dmarcRecords[0];
    const policyTags = dmarcRecord?.match(/(?:^|;)\s*p\s*=/gi) ?? [];
    const policyMatch = policyTags.length === 1
      ? dmarcRecord?.match(/(?:^|;)\s*p=(none|quarantine|reject)(?=\s*(?:;|$))/i)
      : undefined;
    const dmarcPolicy = dmarcRecord
      ? (policyMatch?.[1]?.toLowerCase() as EmailSecurityAnswer["dmarc_policy"] ?? "unknown")
      : undefined;

    const answer: EmailSecurityAnswer = {
      domain: normalizedDomain,
      mx_records: mx.map((record) => ({ exchange: record.exchange, priority: record.priority })),
      spf_present: spfRecords.length > 0,
      spf_records: spfRecords,
      dmarc_present: dmarcRecords.length > 0,
      dmarc_records: dmarcRecords,
      ...(dmarcPolicy !== undefined ? { dmarc_policy: dmarcPolicy } : {})
    };

    const issues: Array<{ code: string; message: string }> = [];
    const hasNullMx = answer.mx_records.some((record) => record.exchange.trim() === ".");
    if (answer.mx_records.length === 0) {
      issues.push({ code: "no_mx_records", message: "No MX records were returned for the domain." });
    } else if (hasNullMx) {
      issues.push({
        code: "null_mx_record",
        message: "The domain publishes a null MX record, indicating that it does not accept email."
      });
    }
    if (!answer.spf_present) issues.push({ code: "spf_missing", message: "No SPF record was found." });
    if (spfRecords.length > 1) issues.push({ code: "spf_multiple_records", message: "Multiple SPF records were found; SPF evaluation may fail until the records are consolidated." });
    if (!answer.dmarc_present) issues.push({ code: "dmarc_missing", message: "No DMARC record was found." });
    if (dmarcRecords.length > 1) issues.push({ code: "dmarc_multiple_records", message: "Multiple DMARC records were found; DMARC evaluation may fail until a single record remains." });
    if (dmarcRecords.length === 1 && dmarcPolicy === "unknown") {
      issues.push({
        code: "dmarc_policy_invalid",
        message: "The DMARC record does not contain a recognized policy value; policy enforcement could not be verified."
      });
    }

    return {
      intent: "EMAIL_SECURITY",
      verdict: issues.length === 0 ? "confirmed" : "uncertain",
      confidence: 1,
      answer,
      evidence: [normalizeEvidence({
        source_id: "dns:email-security:" + normalizedDomain,
        source_type: "dns",
        title: "Email security DNS records for " + normalizedDomain,
        url: "dns://" + normalizedDomain,
        retrieved_at: retrievedAt
      })],
      uncertainty: issues,
      retrieved_at: retrievedAt
    };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
    const invalidDnsResponse = code === "INVALID_DNS_RESPONSE";
    return {
      intent: "EMAIL_SECURITY",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { domain: normalizedDomain, mx_records: [], spf_present: false, spf_records: [], dmarc_present: false, dmarc_records: [] },
      evidence: [],
      uncertainty: [{
        code: invalidDnsResponse ? "invalid_dns_response" : "dns_lookup_failed",
        message: invalidDnsResponse
          ? "The domain DNS service returned records in an invalid format."
          : "The domain DNS records could not be retrieved because the lookup failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
