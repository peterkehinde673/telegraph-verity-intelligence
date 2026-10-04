import type { VerityIntent } from "../intents/catalogue.js";

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

export function validateVerityResponse(
  response: VerityResponse
): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(response.confidence)) {
    errors.push("confidence must be a finite number");
  } else if (response.confidence < 0 || response.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }

  if (!response.intent) {
    errors.push("intent is required");
  }

  if (!response.verdict) {
    errors.push("verdict is required");
  }

  if (!Array.isArray(response.evidence)) {
    errors.push("evidence must be an array");
  }

  if (!Array.isArray(response.uncertainty)) {
    errors.push("uncertainty must be an array");
  }

  if (!response.retrieved_at) {
    errors.push("retrieved_at is required");
  }

  return errors;
}
