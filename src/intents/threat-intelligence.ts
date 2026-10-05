import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export type ThreatIndicatorType = "ip" | "domain" | "url" | "hash";

export interface ThreatIntelligenceMatch {
  source_id: string;
  label: string;
  indicator_type: ThreatIndicatorType;
  indicator: string;
  confidence?: number;
  category?: string;
  first_seen?: string;
  last_seen?: string;
}

export interface ThreatIntelligenceAnswer {
  indicator_type: ThreatIndicatorType;
  indicator: string;
  known_threat: boolean;
  matches: ThreatIntelligenceMatch[];
}

export interface ThreatIntelligenceOptions {
  lookupImpl?: (
    indicator: string,
    type: ThreatIndicatorType
  ) => Promise<ThreatIntelligenceMatch[]>;
  now?: () => string;
}

function classifyIndicator(value: string): ThreatIndicatorType | undefined {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return "ip";
  if (/^https?:\/\//i.test(value)) return "url";
  if (/^[a-f0-9]{32}$/i.test(value) || /^[a-f0-9]{40}$/i.test(value) || /^[a-f0-9]{64}$/i.test(value)) {
    return "hash";
  }
  if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)) {
    return "domain";
  }
  return undefined;
}

export async function queryThreatIntelligence(
  indicator: string,
  options: ThreatIntelligenceOptions = {}
): Promise<VerityResponse<ThreatIntelligenceAnswer>> {
  const normalized = indicator.trim().toLowerCase();
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const type = classifyIndicator(normalized);

  if (!type) {
    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: "rejected",
      confidence: 1,
      answer: { indicator_type: "domain", indicator: normalized, known_threat: false, matches: [] },
      evidence: [],
      uncertainty: [{ code: "invalid_indicator", message: "The indicator must be an IP address, domain, HTTP(S) URL, or file hash." }],
      retrieved_at: retrievedAt
    };
  }

  if (!options.lookupImpl) {
    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { indicator_type: type, indicator: normalized, known_threat: false, matches: [] },
      evidence: [],
      uncertainty: [{ code: "threat_source_unconfigured", message: "No threat-intelligence source is configured for this deployment." }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const matches = await options.lookupImpl(normalized, type);
    const knownThreat = matches.length > 0;

    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: knownThreat ? "confirmed" : "not_found",
      confidence: 1,
      answer: {
        indicator_type: type,
        indicator: normalized,
        known_threat: knownThreat,
        matches
      },
      evidence: matches.map((match) => normalizeEvidence({
        source_id: match.source_id,
        source_type: "threat-intelligence",
        title: match.label,
        url: match.indicator_type === "url" ? match.indicator : undefined,
        retrieved_at: retrievedAt,
        published_at: match.first_seen
      })),
      uncertainty: knownThreat ? [] : [{
        code: "no_known_threat_match",
        message: "No configured threat-intelligence source reported this indicator. This does not prove the indicator is benign."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "THREAT_INTELLIGENCE",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { indicator_type: type, indicator: normalized, known_threat: false, matches: [] },
      evidence: [],
      uncertainty: [{
        code: "threat_lookup_failed",
        message: error instanceof Error ? error.message : "Threat-intelligence lookup failed."
      }],
      retrieved_at: retrievedAt
    };
  }
}
