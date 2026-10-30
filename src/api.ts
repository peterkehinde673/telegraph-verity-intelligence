import type { IncomingMessage, ServerResponse } from "node:http";
import type { VerityIntent } from "./intents/catalogue.js";
import { VERITY_INTENTS } from "./intents/catalogue.js";
import type { VerityResponse } from "./contracts/verity-response.js";

export interface IntentRequest {
  intent: string;
  input: unknown;
}

export type IntentHandler = (
  input: unknown
) => Promise<VerityResponse>;

export interface VerityRouter {
  dispatch(request: IntentRequest): Promise<VerityResponse | null>;
}

function isSupportedIntent(value: string): value is VerityIntent {
  return (VERITY_INTENTS as readonly string[]).includes(value);
}

export function createIntentRouter(
  handlers: Partial<Record<VerityIntent, IntentHandler>>
): VerityRouter {
  return {
    async dispatch(request) {
      if (!isSupportedIntent(request.intent)) return null;

      const handler = handlers[request.intent];
      if (!handler) return null;

      return handler(request.input);
    }
  };
}

export async function readJsonBody(
  request: IncomingMessage,
  maxBytes = 1_048_576
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;

    if (size > maxBytes) {
      throw new Error("request_body_too_large");
    }

    chunks.push(buffer);
  }

  if (size === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function sendJson(
  response: ServerResponse,
  status: number,
  payload: unknown
): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

export function requestToIntentRequest(
  body: unknown
): IntentRequest | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.intent !== "string") return null;

  return {
    intent: candidate.intent,
    input: candidate.input
  };
}
