import { isIP } from "node:net";
import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type ThreatIndicatorType = "ip" | "domain" | "url" | "sha256";

export interface ThreatIntelligencePulse {
  name: string;
  description?: string;
  created?: string;
  modified?: string;
  tags: string[];
}

export interface ThreatIntelligenceAnswer {
  indicator: string;
  indicator_type: ThreatIndicatorType;
  pulse_count: number;
  pulses: ThreatIntelligencePulse[];
  provider: "alienvault-otx";
}

export interface ThreatIntelligenceOptions {
  lookupImpl?: (indicator: string, type: ThreatIndicatorType) => Promise<{
    pulse_count: number;
    pulses: ThreatIntelligencePulse[];
  }>;
  now?: () => string;
}

function normalizeIndicator(input: string, type: ThreatIndicatorType): string | undefined {
  const value = input.trim();
  if (!value) return undefined;
  if (type === "ip") return isIP(value) ? value : undefined;
  if (type === "sha256") return /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : undefined;
  if (type === "url") {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
      return parsed.toString();
    } catch {
      return undefined;
    }
  }
  const domain = value.toLowerCase().replace(/\.$/, "");
  if (domain.length > 253 || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+$/i.test(domain)) return undefined;
  return domain;
}

export async function alienVaultOtxLookup(
  indicator: string,
  type: ThreatIndicatorType,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ pulse_count: number; pulses: ThreatIntelligencePulse[] }> {
  const otxType = type === "ip" ? "IPv4" : type === "sha256" ? "file" : type === "url" ? "url" : "domain";
  const endpoint = new URL(
    `https://otx.alienvault.com/api/v1/indicators/${otxType}/${encodeURIComponent(indicator)}/general`
  );
  const response = await fetchImpl(endpoint, {
    headers: { "X-OTX-API-KEY": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`AlienVault OTX returned HTTP ${response.status}.`);

  const data = await response.json() as {
    pulse_info?: {
      count?: number;
      pulses?: Array<{ name?: string; description?: string; created?: string; modified?: string; tags?: string[] }>;
    };
  };
  const pulses = (data.pulse_info?.pulses ?? []).map((pulse) => ({
    name: pulse.name ?? "Untitled threat pulse",
    ...(pulse.description ? { description: pulse.description.slice(0, 1000) } : {}),
    ...(pulse.created ? { created: pulse.created } : {}),
    ...(pulse.modified ? { modified: pulse.modified } : {}),
    tags: Array.isArray(pulse.tags) ? pulse.tags.slice(0, 20) : []
  }));
  return { pulse_count: data.pulse_info?.count ?? pulses.length, pulses };
}

export async function lookupThreatIntelligence(
  input: unknown,
  options: ThreatIntelligenceOptions = {}
): Promise<VerityResponse<ThreatIntelligenceAnswer>> {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const rawIndicator = typeof value.indicator === "string" ? value.indicator : "";
  const type = typeof value.indicator_type === "string" ? value.indicator_type.toLowerCase() as ThreatIndicatorType : "ip";
  const retrievedAt = options.now?.() ?? new Date().toISOString();

  if (!["ip", "domain", "url", "sha256"].includes(type)) {
    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: "rejected",
      confidence: 1,
      answer: { indicator: rawIndicator.trim(), indicator_type: "ip", pulse_count: 0, pulses: [], provider: "alienvault-otx" },
      evidence: [],
      uncertainty: [{ code: "invalid_indicator_type", message: "indicator_type must be one of ip, domain, url, or sha256." }],
      retrieved_at: retrievedAt
    };
  }

  const normalized = normalizeIndicator(rawIndicator, type);
  if (!normalized) {
    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: "rejected",
      confidence: 1,
      answer: { indicator: rawIndicator.trim(), indicator_type: type, pulse_count: 0, pulses: [], provider: "alienvault-otx" },
      evidence: [],
      uncertainty: [{ code: "invalid_indicator", message: "Provide a valid indicator matching indicator_type." }],
      retrieved_at: retrievedAt
    };
  }

  const lookup = options.lookupImpl ?? (process.env.OTX_API_KEY
    ? (indicator: string, indicatorType: ThreatIndicatorType) => alienVaultOtxLookup(indicator, indicatorType, process.env.OTX_API_KEY!)
    : undefined);
  if (!lookup) {
    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { indicator: normalized, indicator_type: type, pulse_count: 0, pulses: [], provider: "alienvault-otx" },
      evidence: [],
      uncertainty: [{ code: "threat_feed_unconfigured", message: "AlienVault OTX is not configured. Set OTX_API_KEY before making a threat-intelligence assessment." }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const result = await lookup(normalized, type);
    if (
      !result ||
      !Number.isInteger(result.pulse_count) ||
      result.pulse_count < 0 ||
      !Array.isArray(result.pulses)
    ) {
      return {
        intent: "THREAT_INTELLIGENCE",
        verdict: "insufficient_evidence",
        confidence: 0,
        answer: { indicator: normalized, indicator_type: type, pulse_count: 0, pulses: [], provider: "alienvault-otx" },
        evidence: [],
        uncertainty: [{
          code: "invalid_threat_feed_response",
          message: "The threat-intelligence source returned an invalid response."
        }],
        retrieved_at: retrievedAt
      };
    }

    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: result.pulse_count > 0 ? "likely" : "not_found",
      confidence: result.pulse_count > 0 ? 0.8 : 0.65,
      answer: { indicator: normalized, indicator_type: type, ...result, provider: "alienvault-otx" },
      evidence: [normalizeEvidence({
        source_id: `alienvault-otx:${type}:${normalized}`,
        source_type: "threat-intelligence",
        title: `AlienVault OTX threat intelligence for ${normalized}`,
        url: "https://otx.alienvault.com/",
        retrieved_at: retrievedAt,
        metadata: { pulse_count: result.pulse_count, indicator_type: type }
      })],
      uncertainty: [{
        code: "single_feed_limit",
        message: "This result reflects AlienVault OTX only. Pulse counts are contextual signals, not proof of malicious activity; a missing match does not establish that an indicator is benign."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { indicator: normalized, indicator_type: type, pulse_count: 0, pulses: [], provider: "alienvault-otx" },
      evidence: [],
      uncertainty: [{ code: "threat_feed_lookup_failed", message: "The configured threat-intelligence source could not be reached or returned an invalid response." }],
      retrieved_at: retrievedAt
    };
  }
}
