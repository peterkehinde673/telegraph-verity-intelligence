import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";

export interface PlagiarismDocument {
  text: string;
  title?: string;
  url?: string;
  source_id?: string;
}

export interface PlagiarismMatch {
  title: string;
  url?: string;
  similarity: number;
  matched_shingles: number;
}

export interface PlagiarismAnswer {
  comparison_scope: "supplied_corpus";
  documents_checked: number;
  highest_similarity: number;
  matches: PlagiarismMatch[];
  note: string;
}

export interface PlagiarismOptions {
  now?: () => string;
}

function tokens(text: string): string[] {
  return text.toLowerCase()
    .normalize("NFKC")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(text: string, size = 5): Set<string> {
  const words = tokens(text);
  const result = new Set<string>();
  if (words.length < size) {
    if (words.length) result.add(words.join(" "));
    return result;
  }
  for (let i = 0; i <= words.length - size; i++) result.add(words.slice(i, i + size).join(" "));
  return result;
}

function compare(source: Set<string>, candidate: Set<string>): { similarity: number; matched: number } {
  if (!source.size || !candidate.size) return { similarity: 0, matched: 0 };
  let matched = 0;
  for (const item of source) if (candidate.has(item)) matched++;
  // Coverage of the submitted text is more useful for identifying copied passages
  // than a symmetric score when the reference document is much longer.
  return { similarity: matched / source.size, matched };
}

function validHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function detectPlagiarism(
  input: unknown,
  options: PlagiarismOptions = {}
): Promise<VerityResponse<PlagiarismAnswer>> {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const submitted = typeof value.text === "string" ? value.text.trim() : "";
  const corpus = Array.isArray(value.comparison_documents)
    ? value.comparison_documents.filter((item): item is PlagiarismDocument =>
        Boolean(item) && typeof item === "object" &&
        typeof (item as Record<string, unknown>).text === "string" &&
        Boolean(((item as Record<string, unknown>).text as string).trim()))
    : [];
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const emptyAnswer: PlagiarismAnswer = {
    comparison_scope: "supplied_corpus",
    documents_checked: 0,
    highest_similarity: 0,
    matches: [],
    note: "This check compares only against documents supplied in comparison_documents. It does not search the internet or establish plagiarism by itself."
  };

  if (submitted.length < 40) {
    return {
      intent: "PLAGIARISM_DETECTION",
      verdict: "rejected",
      confidence: 1,
      answer: emptyAnswer,
      evidence: [],
      uncertainty: [{ code: "text_too_short", message: "Provide at least 40 characters of text to compare." }],
      retrieved_at: retrievedAt
    };
  }
  if (corpus.length === 0) {
    return {
      intent: "PLAGIARISM_DETECTION",
      verdict: "insufficient_evidence",
      confidence: 0,
      answer: emptyAnswer,
      evidence: [],
      uncertainty: [{ code: "comparison_corpus_missing", message: "Provide comparison_documents with reference text. No web-wide or external corpus search is performed." }],
      retrieved_at: retrievedAt
    };
  }

  const source = shingles(submitted);
  const matches = corpus.map((doc, index) => {
    const compared = compare(source, shingles(doc.text));
    return {
      title: typeof doc.title === "string" && doc.title.trim() ? doc.title.trim() : `Comparison document ${index + 1}`,
      ...(validHttpUrl(doc.url) ? { url: doc.url } : {}),
      similarity: Number(compared.similarity.toFixed(4)),
      matched_shingles: compared.matched
    };
  }).filter(match => match.matched_shingles > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  const highest = matches[0]?.similarity ?? 0;
  const evidence = matches.filter(match => match.url).map((match, index) => normalizeEvidence({
    source_id: `plagiarism-corpus:${match.url}`,
    source_type: "comparison-corpus",
    title: match.title,
    url: match.url!,
    retrieved_at: retrievedAt,
    metadata: { similarity: match.similarity, matched_shingles: match.matched_shingles }
  }));
  const verdict = highest >= 0.6 ? "likely" : highest >= 0.25 ? "uncertain" : "not_found";
  const confidence = highest >= 0.6 ? 0.82 : highest >= 0.25 ? 0.65 : 0.55;

  return {
    intent: "PLAGIARISM_DETECTION",
    verdict,
    confidence,
    answer: {
      comparison_scope: "supplied_corpus",
      documents_checked: corpus.length,
      highest_similarity: Number(highest.toFixed(4)),
      matches,
      note: "Similarity is based on overlapping five-word shingles against the supplied corpus only. It may miss paraphrasing and can flag common wording; human review and source context are required."
    },
    evidence,
    uncertainty: [{
      code: "limited_corpus_similarity",
      message: "This is a bounded text-overlap signal, not a definitive plagiarism finding. Documents without source URLs can contribute to similarity but are not emitted as source evidence."
    }],
    retrieved_at: retrievedAt
  };
}
