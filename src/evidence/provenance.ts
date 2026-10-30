import type { VerityEvidence } from "../contracts/verity-response.js";

export interface ProvenanceSummary {
  source_count: number;
  source_types: string[];
  earliest_published_at?: string;
  latest_published_at?: string;
}

export function summarizeProvenance(
  evidence: VerityEvidence[]
): ProvenanceSummary {
  const published = evidence
    .map((item) => item.published_at)
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    source_count: evidence.length,
    source_types: [...new Set(evidence.map((item) => item.source_type))].sort(),
    ...(published.length > 0
      ? {
          earliest_published_at: published[0],
          latest_published_at: published[published.length - 1]
        }
      : {})
  };
}
