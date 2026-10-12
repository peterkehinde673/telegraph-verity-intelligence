import { promises as dns } from "node:dns";
import * as http from "node:http";
import * as https from "node:https";
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
  if (family === 4) {
    const parts = address.split(".").map(Number);
    const a = parts[0];
    const b = parts[1];
    const c = parts[2];
    if (a === undefined || b === undefined || c === undefined) return true;
    return isPrivateIpv4(address) || a >= 224 || (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) || (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113) ||
      (a === 255 && b === 255 && c === 255);
  }
  if (family !== 6) return true;

  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (isIP(mapped) === 4) return isPrivateAddress(mapped);
    const groups = mapped.split(":");
    if (groups.length === 2 && groups.every(group => /^[0-9a-f]{1,4}$/.test(group))) {
      const high = Number.parseInt(groups[0]!, 16);
      const low = Number.parseInt(groups[1]!, 16);
      const ipv4 = [high >> 8, high & 255, low >> 8, low & 255].join(".");
      return isPrivateAddress(ipv4);
    }
    return true;
  }
  // Conservatively allow only globally allocated unicast space (2000::/3),
  // excluding documentation and transition ranges that should not be scanned.
  const firstHextet = Number.parseInt(normalized.split(":")[0] || "0", 16);
  if (!Number.isFinite(firstHextet) || firstHextet < 0x2000 || firstHextet > 0x3fff) return true;
  return normalized.startsWith("2001:db8:") || normalized.startsWith("2001:0000:") ||
    normalized.startsWith("2002:");
}

async function requestPinnedAddress(url: URL, address: string, timeoutMs: number): Promise<Response> {
  return await new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const pinnedLookup = ((_hostname: string, options: { all?: boolean }, callback: (error: NodeJS.ErrnoException | null, address: string | Array<{ address: string; family: number }>, family?: number) => void) => {
      const family = isIP(address);
      if (options?.all) callback(null, [{ address, family }]);
      else callback(null, address, family);
    }) as never;
    const request = transport.request(url, {
      method: "GET",
      headers: { "user-agent": "telegraph-verity-intelligence/0.1" },
      lookup: pinnedLookup,
      timeout: timeoutMs
    }, (incoming) => {
      incoming.resume();
      const headers = new Headers();
      const location = incoming.headers.location;
      const contentType = incoming.headers["content-type"];
      if (typeof location === "string") headers.set("location", location);
      if (typeof contentType === "string") headers.set("content-type", contentType);
      resolve(new Response(null, {
        status: incoming.statusCode ?? 502,
        statusText: incoming.statusMessage ?? "",
        headers
      }));
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error("Request timed out")));
    request.once("error", reject);
    request.end();
  });
}

async function resolvePublicHost(
  hostname: string,
  lookup: typeof dns.lookup
): Promise<string[]> {
  const unbracketedHost = hostname.replace(/^\\[|\\]$/g, "");
  if (isIP(unbracketedHost)) {
    if (isPrivateAddress(unbracketedHost)) throw new Error("Target address is not publicly routable");
    return [unbracketedHost];
  }

  const results = await lookup(unbracketedHost, { all: true, verbatim: true });
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

  const fetchImpl = options.fetchImpl;
  const lookup = options.lookupImpl ?? dns.lookup;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    return {
      intent: "URL_SCAN",
      verdict: "rejected",
      confidence: 1,
      answer: { input_url: raw, redirect_count: 0, redirects: [], hostname: current.hostname },
      evidence: [],
      uncertainty: [{ code: "invalid_timeout", message: "The timeout must be a positive integer." }],
      retrieved_at: retrievedAt
    };
  }

  if (!Number.isInteger(maxRedirects) || maxRedirects < 0 || maxRedirects > 20) {
    return {
      intent: "URL_SCAN",
      verdict: "rejected",
      confidence: 1,
      answer: { input_url: raw, redirect_count: 0, redirects: [], hostname: current.hostname },
      evidence: [],
      uncertainty: [{ code: "invalid_redirect_limit", message: "The redirect limit must be an integer from 0 to 20." }],
      retrieved_at: retrievedAt
    };
  }

  const redirects: string[] = [];

  for (let attempt = 0; attempt <= maxRedirects; attempt += 1) {
    let resolvedAddresses: string[];
    try {
      resolvedAddresses = await resolvePublicHost(current.hostname, lookup);
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

    let response: Response;
    if (fetchImpl) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
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
    } else {
      // Pin the connection to the exact address that passed the public-address check.
      // The original URL hostname remains intact for Host headers and TLS SNI.
      const pinnedAddress = resolvedAddresses[0];
      if (!pinnedAddress) throw new Error("No vetted target address is available");
      response = await requestPinnedAddress(current, pinnedAddress, timeoutMs);
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
