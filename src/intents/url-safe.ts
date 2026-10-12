import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface UrlSafeMatch {
  threat_type: string;
  platform_type?: string;
  threat_entry?: string;
}

export interface UrlSafeAnswer {
  input_url: string;
  normalized_url: string;
  safe_on_checked_feeds: boolean;
  matches: UrlSafeMatch[];
  provider: "google-safe-browsing";
}

export interface UrlSafeOptions {
  lookupImpl?: (url: string) => Promise<UrlSafeMatch[]>;
  now?: () => string;
}

export async function googleSafeBrowsingLookup(
  url: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<UrlSafeMatch[]> {
  const endpoint = new URL("https://safebrowsing.googleapis.com/v4/threatMatches:find");
  endpoint.searchParams.set("key", apiKey);
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      client: { clientId: "telegraph-verity-intelligence", clientVersion: "0.1.0" },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as {
      error?: {
        status?: string;
        errors?: Array<{ reason?: string }>;
      };
    } | null;
    const apiStatus = errorBody?.error?.status;
    const reasons = (errorBody?.error?.errors ?? [])
      .map((item) => item.reason)
      .filter((reason): reason is string => typeof reason === "string" && /^[A-Z0-9_]+$/.test(reason));
    const safeStatus = typeof apiStatus === "string" && /^[A-Z0-9_]+$/.test(apiStatus)
      ? apiStatus
      : undefined;
    const details = [safeStatus, ...reasons].filter(Boolean).join(", ");
    throw new Error(
      `Google Safe Browsing returned HTTP ${response.status}${details ? ` (${details})` : ""}.`
    );
  }
  const data = await response.json() as {
    matches?: Array<{ threatType?: string; platformType?: string; threat?: { url?: string } }>;
  };
  return (data.matches ?? []).map((match) => ({
    threat_type: match.threatType ?? "UNKNOWN",
    ...(match.platformType ? { platform_type: match.platformType } : {}),
    ...(match.threat?.url ? { threat_entry: match.threat.url } : {})
  }));
}

export async function checkUrlSafe(
  input: string,
  options: UrlSafeOptions = {}
): Promise<VerityResponse<UrlSafeAnswer>> {
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const raw = input.trim();
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    return {
      intent: "URL_SAFE",
      verdict: "rejected",
      confidence: 1,
      answer: { input_url: raw, normalized_url: "", safe_on_checked_feeds: false, matches: [], provider: "google-safe-browsing" },
      evidence: [],
      uncertainty: [{ code: "invalid_url", message: "Provide a complete HTTP or HTTPS URL." }],
      retrieved_at: retrievedAt
    };
  }

  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.username || parsed.password) {
    return {
      intent: "URL_SAFE",
      verdict: "rejected",
      confidence: 1,
      answer: { input_url: raw, normalized_url: "", safe_on_checked_feeds: false, matches: [], provider: "google-safe-browsing" },
      evidence: [],
      uncertainty: [{ code: "unsupported_url", message: "Only HTTP(S) URLs without embedded credentials can be checked." }],
      retrieved_at: retrievedAt
    };
  }

  const normalizedUrl = parsed.toString();
  const lookup = options.lookupImpl ?? (process.env.GOOGLE_SAFE_BROWSING_API_KEY
    ? (url: string) => googleSafeBrowsingLookup(url, process.env.GOOGLE_SAFE_BROWSING_API_KEY!)
    : undefined);

  if (!lookup) {
    return {
      intent: "URL_SAFE",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { input_url: raw, normalized_url: normalizedUrl, safe_on_checked_feeds: false, matches: [], provider: "google-safe-browsing" },
      evidence: [],
      uncertainty: [{ code: "reputation_source_unconfigured", message: "Google Safe Browsing is not configured. No safety conclusion can be made until GOOGLE_SAFE_BROWSING_API_KEY is set." }],
      retrieved_at: retrievedAt
    };
  }

  try {
    const matches = await lookup(normalizedUrl);
    const flagged = matches.length > 0;
    return {
      intent: "URL_SAFE",
      verdict: flagged ? "confirmed" : "not_found",
      confidence: flagged ? 0.99 : 0.85,
      answer: {
        input_url: raw,
        normalized_url: normalizedUrl,
        safe_on_checked_feeds: !flagged,
        matches,
        provider: "google-safe-browsing"
      },
      evidence: [normalizeEvidence({
        source_id: `google-safe-browsing:${normalizedUrl}`,
        source_type: "url-reputation",
        title: flagged ? "URL matched a threat category" : "No match in Google Safe Browsing for this URL",
        url: "https://safebrowsing.google.com/",
        retrieved_at: retrievedAt,
        metadata: { provider: "Google Safe Browsing", match_count: matches.length }
      })],
      uncertainty: flagged ? [] : [{
        code: "feed_non_match_is_not_a_guarantee",
        message: "No match was returned by the configured feed. This does not guarantee the URL is harmless or absent from other threat feeds."
      }],
      retrieved_at: retrievedAt
    };
  } catch (error) {
    return {
      intent: "URL_SAFE",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: { input_url: raw, normalized_url: normalizedUrl, safe_on_checked_feeds: false, matches: [], provider: "google-safe-browsing" },
      evidence: [],
      uncertainty: [{ code: "reputation_lookup_failed", message: error instanceof Error ? error.message : "URL reputation lookup failed." }],
      retrieved_at: retrievedAt
    };
  }
}
