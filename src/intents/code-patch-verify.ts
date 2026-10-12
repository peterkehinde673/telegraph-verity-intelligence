import type { VerityEvidence, VerityResponse } from "../contracts/verity-response.js";

type CheckRun = { name?: string; status?: string; conclusion?: string | null; html_url?: string; started_at?: string | null; completed_at?: string | null; app?: { name?: string } };
type Answer = { repository: string; commit_sha: string; total_checks: number; successful: number; failed: number; pending: number; conclusion: "success" | "failure" | "pending" | "no_checks"; checks: Array<{ name: string; app: string; status: string; conclusion: string; url?: string }> };
type Options = { fetchImpl?: typeof fetch; now?: () => string };

export async function verifyCodePatch(input: unknown, options: Options = {}): Promise<VerityResponse<Answer>> {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const repository = typeof value.repository === "string" ? value.repository.trim() : "";
  const sha = typeof value.commit_sha === "string" ? value.commit_sha.trim() : "";
  const empty = (conclusion: Answer["conclusion"]): Answer => ({
    repository, commit_sha: sha, total_checks: 0, successful: 0, failed: 0, pending: 0, conclusion, checks: []
  });
  const respond = (verdict: VerityResponse<Answer>["verdict"], code: string, message: string, answer = empty("no_checks")): VerityResponse<Answer> => ({
    intent: "CODE_PATCH_VERIFY", verdict, confidence: verdict === "rejected" ? 1 : 0,
    answer, evidence: [], uncertainty: [{ code, message }], retrieved_at: retrievedAt
  });
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || repository.includes(".."))
    return respond("rejected", "invalid_repository", "Provide a public GitHub repository in owner/repo format.");
  if (!/^[a-fA-F0-9]{7,64}$/.test(sha))
    return respond("rejected", "invalid_commit_sha", "Provide a commit SHA of 7–64 hexadecimal characters.");
  const fetcher = options.fetchImpl ?? fetch;
  const headers: Record<string, string> = { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let api: Response;
  let payload: Record<string, unknown>;
  try {
    api = await fetcher(`https://api.github.com/repos/${repository}/commits/${sha}/check-runs?per_page=100`, {
      method: "GET", headers, redirect: "error", signal: AbortSignal.timeout(8000)
    });
    if (api.status === 404) return respond("insufficient_evidence", "commit_or_checks_not_found", "GitHub could not find this public repository/commit or its check runs. Confirm the repository and SHA.");
    if (api.status === 403 || api.status === 429) return respond("insufficient_evidence", "github_rate_limited", "GitHub API access was limited. Configure a scoped GITHUB_TOKEN or retry later.");
    if (!api.ok) return respond("insufficient_evidence", "github_api_error", `GitHub Checks API returned HTTP ${api.status}.`);
    payload = await api.json() as Record<string, unknown>;
  } catch (error) {
    return respond("insufficient_evidence", "github_checks_unavailable", error instanceof Error ? error.message.slice(0, 250) : "Could not retrieve GitHub check runs.");
  }
  const runs = Array.isArray(payload.check_runs) ? payload.check_runs as CheckRun[] : [];
  if (!runs.length) return respond("insufficient_evidence", "no_check_runs", "No GitHub check runs were found for this commit; this is not proof that the patch builds or passes tests.");
  const checks = runs.map(run => ({
    name: typeof run.name === "string" ? run.name : "unnamed check",
    app: typeof run.app?.name === "string" ? run.app.name : "unknown CI app",
    status: typeof run.status === "string" ? run.status : "unknown",
    conclusion: typeof run.conclusion === "string" ? run.conclusion : "pending",
    ...(typeof run.html_url === "string" ? { url: run.html_url } : {})
  }));
  const successful = checks.filter(c => c.status === "completed" && ["success", "neutral", "skipped"].includes(c.conclusion)).length;
  const failed = checks.filter(c => c.status === "completed" && c.conclusion !== "success" && c.conclusion !== "neutral" && c.conclusion !== "skipped").length;
  const pending = checks.length - successful - failed;
  const conclusion: Answer["conclusion"] = pending ? "pending" : failed ? "failure" : "success";
  const answer: Answer = { repository, commit_sha: sha, total_checks: checks.length, successful, failed, pending, conclusion, checks };
  const evidence: VerityEvidence[] = checks.filter(c => c.url).map(c => ({
    source_id: `github-check:${repository}:${sha}:${c.name}`,
    source_type: "github-check-run",
    title: `${c.app}: ${c.name} — ${c.conclusion}`,
    url: c.url!,
    excerpt: `status=${c.status}; conclusion=${c.conclusion}`,
    retrieved_at: retrievedAt,
    metadata: { status: c.status, conclusion: c.conclusion }
  }));
  const verdict = pending ? "uncertain" : failed ? "not_found" : "confirmed";
  return {
    intent: "CODE_PATCH_VERIFY", verdict, confidence: pending ? 0.7 : failed ? 0.95 : 0.9,
    answer, evidence,
    uncertainty: [{
      code: "ci_checks_not_full_semantic_proof",
      message: "This verifies reported GitHub check runs for the specified commit. It does not run code itself, guarantee checks cover all risks, or independently prove that a named defect is fixed; inspect the workflow definitions and test coverage."
    }],
    retrieved_at: retrievedAt
  };
}
