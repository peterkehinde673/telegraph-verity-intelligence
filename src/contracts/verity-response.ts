import type { VerityIntent } from "../intents/catalogue.js";
import { VERITY_INTENTS } from "../intents/catalogue.js";

export type VerityVerdict =
  | "confirmed"
  | "likely"
  | "uncertain"
  | "not_found"
  | "insufficient_evidence"
  | "rejected";

export interface VerityEvidence {
  source_id: string;
  source_type: string;
  title?: string;
  url?: string;
  excerpt?: string;
  retrieved_at: string;
  published_at?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface VerityUncertainty {
  code: string;
  message: string;
}

export interface VerityResponse<TAnswer = unknown> {
  intent: VerityIntent;
  verdict: VerityVerdict;
  confidence: number;
  answer: TAnswer;
  evidence: VerityEvidence[];
  uncertainty: VerityUncertainty[];
  retrieved_at: string;
}

const VERDICTS: readonly VerityVerdict[] = [
  "confirmed",
  "likely",
  "uncertain",
  "not_found",
  "insufficient_evidence",
  "rejected"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  return nonEmptyString(value) && Number.isFinite(Date.parse(value));
}

export function validateVerityResponse(
  response: unknown,
  expectedIntent?: string
): string[] {
  const errors: string[] = [];

  if (!isRecord(response)) return ["response must be an object"];

  if (typeof response.confidence !== "number" || !Number.isFinite(response.confidence)) {
    errors.push("confidence must be a finite number");
  } else if (response.confidence < 0 || response.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }

  if (typeof response.intent !== "string" || !(VERITY_INTENTS as readonly string[]).includes(response.intent)) {
    errors.push("intent must be a supported Verity Intent");
  } else if (expectedIntent !== undefined && response.intent !== expectedIntent) {
    errors.push("intent must match the requested Intent");
  }

  if (typeof response.verdict !== "string" || !(VERDICTS as readonly string[]).includes(response.verdict)) {
    errors.push("verdict must be a supported Verity verdict");
  }

  if (!Object.hasOwn(response, "answer") || response.answer === undefined) {
    errors.push("answer is required");
  }

  if (!Array.isArray(response.evidence)) {
    errors.push("evidence must be an array");
  } else {
    response.evidence.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`evidence[${index}] must be an object`);
        return;
      }
      if (!nonEmptyString(item.source_id)) errors.push(`evidence[${index}].source_id is required`);
      if (!nonEmptyString(item.source_type)) errors.push(`evidence[${index}].source_type is required`);
      if (!isTimestamp(item.retrieved_at)) errors.push(`evidence[${index}].retrieved_at must be a valid timestamp`);
      for (const field of ["title", "url", "excerpt", "published_at"] as const) {
        if (item[field] !== undefined && typeof item[field] !== "string") {
          errors.push(`evidence[${index}].${field} must be a string`);
        }
      }
      if (item.metadata !== undefined) {
        if (!isRecord(item.metadata)) {
          errors.push(`evidence[${index}].metadata must be an object`);
        } else if (Object.values(item.metadata).some(value =>
          value !== null && typeof value !== "string" && typeof value !== "boolean" &&
          !(typeof value === "number" && Number.isFinite(value))
        )) {
          errors.push(`evidence[${index}].metadata values must be JSON scalars`);
        }
      }
    });
  }

  if (!Array.isArray(response.uncertainty)) {
    errors.push("uncertainty must be an array");
  } else {
    response.uncertainty.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`uncertainty[${index}] must be an object`);
        return;
      }
      if (!nonEmptyString(item.code)) errors.push(`uncertainty[${index}].code is required`);
      if (!nonEmptyString(item.message)) errors.push(`uncertainty[${index}].message is required`);
    });
  }

  if (!isTimestamp(response.retrieved_at)) {
    errors.push("retrieved_at must be a valid timestamp");
  }

  return errors;
}
