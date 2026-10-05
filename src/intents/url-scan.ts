import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

const MAX_REDIRECTS = 5;

export interface UrlScanAnswer {
  input_url: string;
  final_url?: string;
  status_code?: number;
  status_text?: string;
  content_type?: string;
  redirect_count: number;
  redirects: string[];
  hostname: string;
}

export interface UrlScanOptions {
  fetchImpl?: typeof fetch;
  lookupImpl?: typeof dns.lookup;
  timeoutMs?: number;
  maxRedirects?: number;
  now?: () => string;
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const a = parts[0];
  const b = parts[1];
  if (a === undefined || b === undefined) return true;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127);
}

function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family !== 6) return true;

  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" ||
    normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd");
}

async function resolvePublicHost(
  hostname: string,
  lookup: typeof dns.lookup
): Promise<string[]> {
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Target address is not publicly routable");
    return [hostname];
  }

  const results = await lookup(hostname, { all: true, verbatim: true });
  const addresses = results.map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error("Target hostname resolves to a non-public address");
  }
  return addresses;
}

export async function scanUrl(
  input: string,
  options: UrlScanOptions = {}
): Promise<VerityResponse<UrlScanAnswer>> {
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const raw = input.trim();

  let current: URL;
  try {
    current = new URL(raw);
  } catch {
    return {
      intent: "URL_SCAN",
      verdict: "rejected",
      confidence: 1,
      answer: { input_url: raw, redirect_count: 0, redirects: [], hostname: "" },
      evidence: [],
      uncertainty: [{ code: "invalid_url", message: "The supplied value is not a valid URL." }],
      retrieved_at: retrievedAt
    };
  }

  if (current.protocol !== "http:" && current.protocol !== "https:") {
    return {
      intent: "URL_SCAN",
      verdict: "rejected",
      confidence: 1,
      answer: { input_url: raw, redirect_count: 0, redirects: [], hostname: current.hostname },
      evidence: [],
      uncertainty: [{ code: "unsupported_scheme", message: "Only HTTP and HTTPS URLs are supported." }],
      retrieved_at: retrievedAt
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const lookup = options.lookupImpl ?? dns.lookup;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const redirects: string[] = [];

  for (let attempt = 0; attempt <= maxRedirects; attempt += 1) {
    try {
      await resolvePublicHost(current.hostname, lookup);
    } catch (error) {
      return {
        intent: "URL_SCAN",
        verdict: "rejected",
        confidence: 1,
        answer: {
          input_url: raw,
          final_url: current.toString(),
          redirect_count: redirects.length,
          redirects,
          hostname: current.hostname
        },
        evidence: [],
        uncertainty: [{
          code: "non_public_target",
          message: error instanceof Error ? error.message : "Target is not publicly routable."
        }],
        retrieved_at: retrievedAt
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "telegraph-verity-intelligence/0.1" }
      });
    } finally {
      clearTimeout(timer);
    }

    const location = response.headers.get("location");
    const isRedirect = response.status >= 300 && response.status < 400 && Boolean(location);

    if (!isRedirect) {
      const contentType = response.headers.get("content-type");
      const answer: UrlScanAnswer = {
        input_url: raw,
        final_url: current.toString(),
        status_code: response.status,
        status_text: response.statusText,
        redirect_count: redirects.length,
        redirects,
        hostname: current.hostname,
        ...(contentType ? { content_type: contentType } : {})
      };

      return {
        intent: "URL_SCAN",
        verdict: response.ok ? "confirmed" : "uncertain",
        confidence: 1,
        answer,
        evidence: [normalizeEvidence({
          source_id: "url:" + current.toString(),
          source_type: "http",
          title: "URL scan for " + current.hostname,
          url: current.toString(),
          retrieved_at: retrievedAt
        })],
        uncertainty: response.ok ? [] : [{
          code: "http_not_success",
          message: "The URL responded with an HTTP status outside the successful 2xx range."
        }],
        retrieved_at: retrievedAt
      };
    }

    if (attempt === maxRedirects) {
      return {
        intent: "URL_SCAN",
        verdict: "uncertain",
        confidence: 1,
        answer: {
          input_url: raw,
          final_url: current.toString(),
          redirect_count: redirects.length,
          redirects,
          hostname: current.hostname
        },
        evidence: [],
        uncertainty: [{
          code: "redirect_limit",
          message: "The URL exceeded the configured redirect limit."
        }],
        retrieved_at: retrievedAt
      };
    }

    const next = new URL(location!, current);
    if (next.protocol !== "http:" && next.protocol !== "https:") {
      return {
        intent: "URL_SCAN",
        verdict: "rejected",
        confidence: 1,
        answer: {
          input_url: raw,
          final_url: current.toString(),
          redirect_count: redirects.length,
          redirects,
          hostname: current.hostname
        },
        evidence: [],
        uncertainty: [{
          code: "unsupported_redirect_scheme",
          message: "The URL redirected to a non-HTTP(S) scheme."
        }],
        retrieved_at: retrievedAt
      };
    }

    redirects.push(next.toString());
    current = next;
  }

  throw new Error("Unreachable URL scan state");
}
