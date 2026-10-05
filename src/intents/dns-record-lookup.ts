import { promises as dns } from "node:dns";
import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT" | "SRV" | "CAA";

export interface DnsRecordAnswer {
  hostname: string;
  record_type: DnsRecordType;
  records: unknown[];
}

export interface DnsLookupOptions {
  resolveImpl?: typeof dns.resolve;
  now?: () => string;
}

const supportedTypes = new Set<DnsRecordType>([
  "A", "AAAA", "CNAME", "MX", "NS", "TXT", "SRV", "CAA"
]);

export async function lookupDnsRecord(
  hostname: string,
  recordType: DnsRecordType = "A",
  options: DnsLookupOptions = {}
): Promise<VerityResponse<DnsRecordAnswer>> {
  const normalizedHost = hostname.trim().toLowerCase().replace(/\.$/, "");
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!normalizedHost) {
    return {
      intent: "DNS_RECORD_LOOKUP",
      verdict: "rejected",
      confidence: 1,
      answer: { hostname: normalizedHost, record_type: recordType, records: [] },
      evidence: [],
      uncertainty: [{ code: "invalid_hostname", message: "A hostname is required." }],
      retrieved_at: retrievedAt
    };
  }

  if (!supportedTypes.has(recordType)) {
    return {
      intent: "DNS_RECORD_LOOKUP",
      verdict: "rejected",
      confidence: 1,
      answer: { hostname: normalizedHost, record_type: recordType, records: [] },
      evidence: [],
      uncertainty: [{ code: "unsupported_record_type", message: "The requested DNS record type is not supported by this implementation." }],
      retrieved_at: retrievedAt
    };
  }

  const resolve = options.resolveImpl ?? dns.resolve;

  try {
    const records = await resolve(normalizedHost, recordType as never) as unknown[];
    const evidence = normalizeEvidence({
      source_id: "dns:" + normalizedHost + ":" + recordType,
      source_type: "dns",
      title: recordType + " records for " + normalizedHost,
      url: "dns://" + normalizedHost + "?type=" + recordType,
      retrieved_at: retrievedAt
    });

    return {
      intent: "DNS_RECORD_LOOKUP",
      verdict: "confirmed",
      confidence: 1,
      answer: { hostname: normalizedHost, record_type: recordType, records },
      evidence: [evidence],
      uncertainty: [],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String((error as Error & { code?: unknown }).code) : undefined;
    if (code === "ENODATA" || code === "ENOTFOUND") {
      return {
        intent: "DNS_RECORD_LOOKUP",
        verdict: "not_found",
        confidence: 1,
        answer: { hostname: normalizedHost, record_type: recordType, records: [] },
        evidence: [normalizeEvidence({
          source_id: "dns:" + normalizedHost + ":" + recordType,
          source_type: "dns",
          title: recordType + " records for " + normalizedHost,
          retrieved_at: retrievedAt
        })],
        uncertainty: [],
        retrieved_at: retrievedAt
      };
    }
    throw error;
  }
}
