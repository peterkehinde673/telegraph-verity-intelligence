import { isIP } from "node:net";
import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface ThreatIpReputationAnswer {
  ip_address: string;
  abuse_confidence_score: number;
  total_reports: number;
  country_code?: string;
  isp?: string;
  domain?: string;
  is_tor?: boolean;
  last_reported_at?: string;
  provider: "abuseipdb";
}

export interface ThreatIpReputationOptions {
  lookupImpl?: (ip: string) => Promise<Omit<ThreatIpReputationAnswer, "ip_address" | "provider">>;
  now?: () => string;
}

export async function abuseIpDbLookup(
  ip: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<Omit<ThreatIpReputationAnswer, "ip_address" | "provider">> {
  const endpoint = new URL("https://api.abuseipdb.com/api/v2/check");
  endpoint.searchParams.set("ipAddress", ip);
  endpoint.searchParams.set("maxAgeInDays", "90");
  const response = await fetchImpl(endpoint, {
    headers: { Key: apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`AbuseIPDB returned HTTP ${response.status}.`);

  const payload = await response.json() as {
    data?: {
      abuseConfidenceScore?: number;
      totalReports?: number;
      countryCode?: string;
      isp?: string;
      domain?: string;
      isTor?: boolean;
      lastReportedAt?: string | null;
    };
  };
  const data = payload.data;
  if (!data || typeof data.abuseConfidenceScore !== "number") {
    throw new Error("AbuseIPDB returned an incomplete reputation record.");
  }

  return {
    abuse_confidence_score: data.abuseConfidenceScore,
    total_reports: typeof data.totalReports === "number" ? data.totalReports : 0,
    ...(data.countryCode ? { country_code: data.countryCode } : {}),
    ...(data.isp ? { isp: data.isp } : {}),
    ...(data.domain ? { domain: data.domain } : {}),
    ...(typeof data.isTor === "boolean" ? { is_tor: data.isTor } : {}),
    ...(data.lastReportedAt ? { last_reported_at: data.lastReportedAt } : {})
  };
}

export async function checkThreatIpReputation(
  input: string,
  options: ThreatIpReputationOptions = {}
): Promise<VerityResponse<ThreatIpReputationAnswer>> {
  const ip = input.trim();
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (isIP(ip) === 0) {
    return {
      intent: "THREAT_IP_REPUTATION",
      verdict: "rejected",
      confidence: 1,
      answer: { ip_address: ip, abuse_confidence_score: 0, total_reports: 0, provider: "abuseipdb" },
      evidence: [],
      uncertainty: [{ code: "invalid_ip", message: "Provide a valid IPv4 or IPv6 address." }],
      retrieved_at: retrievedAt
    };
  }

  const lookup = options.lookupImpl ?? (process.env.ABUSEIPDB_API_KEY
    ? (address: string) => abuseIpDbLookup(address, process.env.ABUSEIPDB_API_KEY!)
    : undefined);

  if (!lookup) {
    return {
      intent: "THREAT_IP_REPUTATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { ip_address: ip, abuse_confidence_score: 0, total_reports: 0, provider: "abuseipdb" },
      evidence: [],
      uncertainty: [{ code: "reputation_source_unconfigured", message: "AbuseIPDB is not configured. Set ABUSEIPDB_API_KEY before making a threat-reputation assessment." }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const record = await lookup(ip);
    const score = Math.max(0, Math.min(100, record.abuse_confidence_score));
    const verdict = score >= 75 ? "confirmed" : score >= 25 ? "likely" : "uncertain";
    return {
      intent: "THREAT_IP_REPUTATION",
      verdict,
      confidence: score >= 75 ? 0.95 : score >= 25 ? 0.8 : 0.6,
      answer: { ip_address: ip, ...record, abuse_confidence_score: score, provider: "abuseipdb" },
      evidence: [normalizeEvidence({
        source_id: `abuseipdb:ip:${ip}`,
        source_type: "ip-reputation",
        title: `AbuseIPDB reputation for ${ip}`,
        url: "https://www.abuseipdb.com/",
        retrieved_at: retrievedAt,
        metadata: { abuse_confidence_score: score, total_reports: record.total_reports }
      })],
      uncertainty: [{
        code: "reputation_is_signal_not_proof",
        message: "Reputation scores are indicators, not proof that an IP is malicious or benign. Consider report recency, shared hosting, VPNs, and the operational context."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "THREAT_IP_REPUTATION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { ip_address: ip, abuse_confidence_score: 0, total_reports: 0, provider: "abuseipdb" },
      evidence: [],
      uncertainty: [{ code: "reputation_lookup_failed", message: error instanceof Error ? error.message : "IP reputation lookup failed." }],
      retrieved_at: retrievedAt
    };
  }
}
