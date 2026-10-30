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

const CERTIFICATE_ERROR_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "CERT_REVOKED",
  "ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED"
]);

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "TLS_CONNECTION_ERROR";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : "TLS_CONNECTION_ERROR";
}

export async function verifySsl(hostname: string, port = 443, options: SslVerificationOptions = {}): Promise<VerityResponse<SslVerificationAnswer>> {
  const normalizedHost = hostname.trim().toLowerCase();
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!normalizedHost) return { intent: "SSL_VERIFICATION", verdict: "rejected", confidence: 1, answer: { hostname: normalizedHost, port, authorized: false }, evidence: [], uncertainty: [{ code: "invalid_hostname", message: "A hostname is required." }], retrieved_at: retrievedAt };
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) return { intent: "SSL_VERIFICATION", verdict: "rejected", confidence: 1, answer: { hostname: normalizedHost, port, authorized: false }, evidence: [], uncertainty: [{ code: "invalid_timeout", message: "The timeout must be a positive integer." }], retrieved_at: retrievedAt };
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { intent: "SSL_VERIFICATION", verdict: "rejected", confidence: 1, answer: { hostname: normalizedHost, port, authorized: false }, evidence: [], uncertainty: [{ code: "invalid_port", message: "The port must be an integer between 1 and 65535." }], retrieved_at: retrievedAt };

  const connect = options.connectImpl ?? tls.connect;
  return await new Promise((resolve) => {
    let socket: ReturnType<typeof tls.connect> | undefined;
    let settled = false;
    const finish = (response: VerityResponse<SslVerificationAnswer>) => {
      if (settled) return;
      settled = true;
      socket?.destroy();
      resolve(response);
    };
    const failure = (code: string, message: string, certificateFailure: boolean) => finish({
      intent: "SSL_VERIFICATION",
      verdict: certificateFailure ? "rejected" : "uncertain",
      confidence: certificateFailure ? 1 : 0,
      answer: { hostname: normalizedHost, port, authorized: false, authorization_error: code },
      evidence: [],
      uncertainty: [{ code: certificateFailure ? "certificate_not_authorized" : "tls_connection_failed", message }],
      retrieved_at: retrievedAt
    });

    try {
      socket = connect({ host: normalizedHost, port, servername: normalizedHost, rejectUnauthorized: true });
    } catch (error) {
      const code = errorCode(error);
      const certificateFailure = CERTIFICATE_ERROR_CODES.has(code);
      failure(code, certificateFailure
        ? "The TLS endpoint presented a certificate that could not be trusted or validated."
        : "The TLS endpoint could not be verified because the connection failed.", certificateFailure);
      return;
    }
    if (!socket) return;

    socket.setTimeout(timeoutMs, () => {
      failure("TLS_TIMEOUT", "The TLS connection timed out before verification completed.", false);
    });
    socket.once("secureConnect", () => {
      if (!socket || settled) return;
      const certificate = socket.getPeerCertificate();
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();
      const answer: SslVerificationAnswer = {
        hostname: normalizedHost, port, authorized: socket.authorized,
        ...(protocol ? { protocol } : {}),
        ...(cipher.name ? { cipher: cipher.name } : {}),
        ...(certificate.subject ? { subject: certificate.subject } : {}),
        ...(certificate.issuer ? { issuer: certificate.issuer } : {}),
        ...(certificate.valid_from ? { valid_from: certificate.valid_from } : {}),
        ...(certificate.valid_to ? { valid_to: certificate.valid_to } : {}),
        ...(certificate.fingerprint256 ? { fingerprint256: certificate.fingerprint256 } : {}),
        ...(certificate.serialNumber ? { serial_number: certificate.serialNumber } : {}),
        ...(certificate.subjectaltname ? { subject_alt_names: certificate.subjectaltname } : {}),
        ...(socket.authorizationError ? {
          authorization_error: typeof socket.authorizationError === "string" && /^[A-Z0-9_]+$/.test(socket.authorizationError)
            ? socket.authorizationError
            : "CERTIFICATE_NOT_AUTHORIZED"
        } : {})
      };
      const endpoint = "tls:" + normalizedHost + ":" + port;
      finish({
        intent: "SSL_VERIFICATION",
        verdict: socket.authorized ? "confirmed" : "rejected",
        confidence: 1,
        answer,
        evidence: [normalizeEvidence({
          source_id: endpoint,
          source_type: "tls",
          title: "TLS certificate for " + normalizedHost,
          url: "https://" + normalizedHost + ":" + port + "/",
          retrieved_at: retrievedAt
        })],
        uncertainty: socket.authorized ? [] : [{
          code: "certificate_not_authorized",
          message: "The TLS certificate was not authorized by the local trust store."
        }],
        retrieved_at: retrievedAt
      });
    });
    socket.once("error", (error) => {
      if (settled) return;
      const code = errorCode(error);
      const certificateFailure = CERTIFICATE_ERROR_CODES.has(code);
      failure(code, certificateFailure
        ? "The TLS endpoint presented a certificate that could not be trusted or validated."
        : "The TLS endpoint could not be verified because the connection failed.", certificateFailure);
    });
  });
}
