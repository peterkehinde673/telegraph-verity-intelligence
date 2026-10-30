import type { VerityEvidence } from "../contracts/verity-response.js";

export interface EvidenceInput {
  source_id: string;
  source_type: string;
  title?: string | null;
  url?: string | null;
  excerpt?: string | null;
  retrieved_at: string;
  published_at?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

function cleanOptional(value: string | null | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

export function normalizeEvidence(input: EvidenceInput): VerityEvidence {
  const evidence: VerityEvidence = {
    source_id: input.source_id.trim(),
    source_type: input.source_type.trim(),
    retrieved_at: input.retrieved_at
  };

  const title = cleanOptional(input.title);
  const url = cleanOptional(input.url);
  const excerpt = cleanOptional(input.excerpt);
  const publishedAt = cleanOptional(input.published_at);

  if (title) evidence.title = title;
  if (url) evidence.url = url;
  if (excerpt) evidence.excerpt = excerpt;
  if (publishedAt) evidence.published_at = publishedAt;
  if (input.metadata) evidence.metadata = { ...input.metadata };

  return evidence;
}

export function deduplicateEvidence(
  evidence: VerityEvidence[]
): VerityEvidence[] {
  const seen = new Set<string>();

  return evidence.filter((item) => {
    const key = [
      item.source_id,
      item.url ?? "",
      item.retrieved_at
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
