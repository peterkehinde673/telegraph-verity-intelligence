import { promises as dns } from "node:dns";
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
  const records = await resolve(name, "TXT") as string[][];
  return records.map((record) => record.join(""));
}

export async function checkEmailSecurity(
  domain: string,
  options: EmailSecurityOptions = {}
): Promise<VerityResponse<EmailSecurityAnswer>> {
  const normalizedDomain = domain.trim().toLowerCase().replace(/\.$/, "");
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const resolve = options.resolveImpl ?? dns.resolve;

  if (!normalizedDomain || normalizedDomain.includes("@") || normalizedDomain.includes(" ")) {
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
      resolveTxt(resolve, normalizedDomain).catch(() => []),
      resolveTxt(resolve, "_dmarc." + normalizedDomain).catch(() => [])
    ]);

    const spfRecords = spf.filter((record) => /^v=spf1(?:\s|$)/i.test(record));
    const dmarcRecords = dmarc.filter((record) => /^v=dmarc1(?:[;\s]|$)/i.test(record));
    const dmarcRecord = dmarcRecords[0];
    const policyMatch = dmarcRecord?.match(/(?:^|\s)p=(none|quarantine|reject)(?:\s|$)/i);
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
    if (answer.mx_records.length === 0) issues.push({ code: "no_mx_records", message: "No MX records were returned for the domain." });
    if (!answer.spf_present) issues.push({ code: "spf_missing", message: "No SPF record was found." });
    if (!answer.dmarc_present) issues.push({ code: "dmarc_missing", message: "No DMARC record was found." });

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
    return {
      intent: "EMAIL_SECURITY",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { domain: normalizedDomain, mx_records: [], spf_present: false, spf_records: [], dmarc_present: false, dmarc_records: [] },
      evidence: [],
      uncertainty: [{
        code: "dns_lookup_failed",
        message: error instanceof Error ? error.message : "DNS lookup failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
