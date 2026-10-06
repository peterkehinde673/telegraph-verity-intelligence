export interface VerityConfig {
  port: number;
  maxBodyBytes: number;
  environment: "development" | "test" | "production";
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function environment(value: string | undefined): VerityConfig["environment"] {
  if (value === "production" || value === "test") return value;
  return "development";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): VerityConfig {
  return {
    port: positiveInteger(env.PORT, 3000),
    maxBodyBytes: positiveInteger(env.VERITY_MAX_BODY_BYTES, 1_048_576),
    environment: environment(env.NODE_ENV)
  };
}
