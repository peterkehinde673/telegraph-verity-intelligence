import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

const MAX_PERIOD_SECONDS = 366 * 24 * 60 * 60;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function isValidIsoUtc(value: string): boolean {
  if (!ISO_UTC_PATTERN.test(value)) return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  const canonicalInput = value.replace(/\.(\d{1,3})Z$/, (_match, fraction: string) => `.${fraction.padEnd(3, "0")}Z`)
    .replace(/(?<!\.)Z$/, ".000Z");
  return new Date(parsed).toISOString() === canonicalInput;
}

export interface SlaComplianceAnswer {
  metric: "uptime";
  period_start: string;
  period_end: string;
  period_seconds: number | null;
  measured_seconds: number | null;
  downtime_seconds: number | null;
  target_uptime_percent: number | null;
  observed_uptime_percent: number | null;
  meets_target: boolean | null;
}

function answer(value: Record<string, unknown>): SlaComplianceAnswer {
  return {
    metric: "uptime",
    period_start: typeof value.period_start === "string" ? value.period_start : "",
    period_end: typeof value.period_end === "string" ? value.period_end : "",
    period_seconds: null,
    measured_seconds: typeof value.measured_seconds === "number" ? value.measured_seconds : null,
    downtime_seconds: typeof value.downtime_seconds === "number" ? value.downtime_seconds : null,
    target_uptime_percent: typeof value.target_uptime_percent === "number" ? value.target_uptime_percent : null,
    observed_uptime_percent: null,
    meets_target: null
  };
}

function rejected(result: SlaComplianceAnswer, retrievedAt: string, code: string, message: string): VerityResponse<SlaComplianceAnswer> {
  return {
    intent: "SLA_COMPLIANCE", verdict: "rejected", confidence: 1, answer: result, evidence: [],
    uncertainty: [{ code, message }], retrieved_at: retrievedAt
  };
}

export function slaCompliance(input: unknown, now: () => string = () => new Date().toISOString()): VerityResponse<SlaComplianceAnswer> {
  const value = input !== null && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const result = answer(value);
  const retrievedAt = now();

  if (value.metric !== "uptime") {
    return rejected(result, retrievedAt, "unsupported_sla_metric", "This implementation calculates uptime only; response-time and resolution-time SLAs are not assessed.");
  }
  const start = value.period_start;
  const end = value.period_end;
  if (typeof start !== "string" || typeof end !== "string" ||
      !isValidIsoUtc(start) || !isValidIsoUtc(end)) {
    return rejected(result, retrievedAt, "invalid_sla_period", "Provide period_start and period_end as valid UTC ISO 8601 timestamps.");
  }
  const durationMilliseconds = Date.parse(end) - Date.parse(start);
  const periodSeconds = durationMilliseconds / 1000;
  if (!Number.isInteger(periodSeconds) || periodSeconds <= 0 || periodSeconds > MAX_PERIOD_SECONDS) {
    return rejected(result, retrievedAt, "invalid_sla_period", "The measured period must be positive, whole-second aligned, and no longer than 366 days.");
  }
  const measured = value.measured_seconds;
  const downtime = value.downtime_seconds;
  const target = value.target_uptime_percent;
  if (!Number.isSafeInteger(measured) || measured !== periodSeconds ||
      !Number.isSafeInteger(downtime) || (downtime as number) < 0 || (downtime as number) > periodSeconds ||
      typeof target !== "number" || !Number.isFinite(target) || target < 0 || target > 100 ||
      !Number.isInteger(target * 100)) {
    return rejected(result, retrievedAt, "invalid_sla_measurements", "Provide full-period integer measured_seconds, downtime_seconds within that period, and a target_uptime_percent from 0 to 100 with at most two decimal places.");
  }

  const availableSeconds = periodSeconds - (downtime as number);
  const uptimePercent = availableSeconds * 100 / periodSeconds;
  const targetBasisPoints = Math.round(target * 100);
  const meetsTarget = availableSeconds * 10_000 >= periodSeconds * targetBasisPoints;
  const completed: SlaComplianceAnswer = {
    ...result,
    period_seconds: periodSeconds,
    measured_seconds: measured as number,
    downtime_seconds: downtime as number,
    observed_uptime_percent: Number(uptimePercent.toFixed(6)),
    meets_target: meetsTarget
  };
  const evidence = normalizeEvidence({
    source_id: `user-supplied-sla-uptime:${start}:${end}`,
    source_type: "user-provided-measurement",
    title: "Supplied uptime measurement summary",
    excerpt: `For ${start} to ${end}, supplied measurements report ${downtime} seconds of downtime across ${measured} measured seconds. Verity calculated ${completed.observed_uptime_percent}% uptime against a stated ${target}% target.`,
    retrieved_at: retrievedAt
  });

  return {
    intent: "SLA_COMPLIANCE", verdict: "confirmed", confidence: 1, answer: completed,
    evidence: [evidence],
    uncertainty: [{
      code: "measurements_not_independently_verified",
      message: "This is arithmetic on caller-supplied full-period totals. Verity did not validate monitoring records, exclusions, maintenance windows, or contract interpretation."
    }],
    retrieved_at: retrievedAt
  };
}
