import tls from "node:tls";
import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface SslVerificationAnswer {
  hostname: string; port: number; authorized: boolean;
  protocol?: string; cipher?: string;
  subject?: tls.Certificate; issuer?: tls.Certificate;
  valid_from?: string; valid_to?: string; fingerprint256?: string;
  serial_number?: string; subject_alt_names?: string; authorization_error?: string;
}
export interface SslVerificationOptions { connectImpl?: typeof tls.connect; timeoutMs?: number; now?: () => string; }

export async function verifySsl(hostname: string, port = 443, options: SslVerificationOptions = {}): Promise<VerityResponse<SslVerificationAnswer>> {
  const normalizedHost = hostname.trim().toLowerCase();
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!normalizedHost) return { intent: "SSL_VERIFICATION", verdict: "rejected", confidence: 1, answer: { hostname: normalizedHost, port, authorized: false }, evidence: [], uncertainty: [{ code: "invalid_hostname", message: "A hostname is required." }], retrieved_at: retrievedAt };
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) return { intent: "SSL_VERIFICATION", verdict: "rejected", confidence: 1, answer: { hostname: normalizedHost, port, authorized: false }, evidence: [], uncertainty: [{ code: "invalid_timeout", message: "The timeout must be a positive integer." }], retrieved_at: retrievedAt };
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { intent: "SSL_VERIFICATION", verdict: "rejected", confidence: 1, answer: { hostname: normalizedHost, port, authorized: false }, evidence: [], uncertainty: [{ code: "invalid_port", message: "The port must be an integer between 1 and 65535." }], retrieved_at: retrievedAt };

  const connect = options.connectImpl ?? tls.connect;
  return await new Promise((resolve, reject) => {
    const socket = connect({ host: normalizedHost, port, servername: normalizedHost, rejectUnauthorized: true });
    let settled = false;
    const finish = (response: VerityResponse<SslVerificationAnswer>) => { if (settled) return; settled = true; socket.destroy(); resolve(response); };
    socket.setTimeout(timeoutMs, () => { if (settled) return; settled = true; socket.destroy(); reject(new Error("TLS connection timed out")); });
    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      const cipher = socket.getCipher();
      const answer: SslVerificationAnswer = {
        hostname: normalizedHost, port, authorized: socket.authorized,
        ...(socket.getProtocol() ? { protocol: socket.getProtocol()! } : {}),
        ...(cipher.name ? { cipher: cipher.name } : {}),
        ...(certificate.subject ? { subject: certificate.subject } : {}),
        ...(certificate.issuer ? { issuer: certificate.issuer } : {}),
        ...(certificate.valid_from ? { valid_from: certificate.valid_from } : {}),
        ...(certificate.valid_to ? { valid_to: certificate.valid_to } : {}),
        ...(certificate.fingerprint256 ? { fingerprint256: certificate.fingerprint256 } : {}),
        ...(certificate.serialNumber ? { serial_number: certificate.serialNumber } : {}),
        ...(certificate.subjectaltname ? { subject_alt_names: certificate.subjectaltname } : {}),
        ...(socket.authorizationError ? { authorization_error: String(socket.authorizationError) } : {})
      };
      const endpoint = "tls:" + normalizedHost + ":" + port;
      finish({ intent: "SSL_VERIFICATION", verdict: socket.authorized ? "confirmed" : "rejected", confidence: 1, answer,
        evidence: [normalizeEvidence({ source_id: endpoint, source_type: "tls", title: "TLS certificate for " + normalizedHost, url: "https://" + normalizedHost + ":" + port + "/", retrieved_at: retrievedAt })],
        uncertainty: socket.authorized ? [] : [{ code: "certificate_not_authorized", message: socket.authorizationError ? String(socket.authorizationError) : "The TLS certificate was not authorized by the local trust store." }],
        retrieved_at: retrievedAt });
    });
    socket.once("error", (error) => { if (settled) return; settled = true; socket.destroy(); reject(error); });
  });
}