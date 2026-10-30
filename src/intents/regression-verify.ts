import type { VerityEvidence, VerityResponse } from "../contracts/verity-response.js";

type Check = { name: string; path: string; status: "passed" | "failed" | "error"; actual_status?: number; expected_status: number; detail: string };
type Answer = { checks_run: number; passed: number; failed: number; errors: number; results: Check[]; execution_mode: "allowlisted_https_get" };
type Options = { allowedHosts?: string[]; fetchImpl?: typeof fetch; now?: () => string };
const obj = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
function atPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((v, k) => v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined, value);
}
export async function verifyRegression(input: unknown, options: Options = {}): Promise<VerityResponse<Answer>> {
  const value = obj(input);
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const hosts = options.allowedHosts ?? (process.env.REGRESSION_ALLOWED_HOSTS ?? "").split(",").map(x => x.trim()).filter(Boolean);
  const empty: Answer = { checks_run: 0, passed: 0, failed: 0, errors: 0, results: [], execution_mode: "allowlisted_https_get" };
  const response = (verdict: VerityResponse<Answer>["verdict"], code: string, message: string): VerityResponse<Answer> => ({
    intent: "REGRESSION_VERIFY", verdict, confidence: verdict === "rejected" ? 1 : 0, answer: empty, evidence: [],
    uncertainty: [{ code, message }], retrieved_at: retrievedAt
  });
  if (!hosts.length) return response("insufficient_evidence", "regression_hosts_not_configured", "Set REGRESSION_ALLOWED_HOSTS to comma-separated HTTPS hostnames before enabling live regression probes.");
  let base: URL;
  try { base = new URL(typeof value.base_url === "string" ? value.base_url : ""); }
  catch { return response("rejected", "invalid_base_url", "Provide a valid HTTPS base_url."); }
  if (base.protocol !== "https:" || !new Set(hosts.map(x => x.toLowerCase())).has(base.hostname.toLowerCase()) || base.username || base.password || base.search || base.hash)
    return response("rejected", "base_url_not_allowlisted", "Only HTTPS URLs on an exact hostname in REGRESSION_ALLOWED_HOSTS are accepted; credentials, query strings and fragments are disallowed.");
  const checks = Array.isArray(value.checks) ? value.checks.slice(0, 10) : [];
  if (!checks.length || checks.some(v => {
    const c = obj(v);
    return typeof c.path !== "string" || !c.path.startsWith("/") || c.path.startsWith("//") || c.path.includes("\\") ||
      (c.expected_status !== undefined && (!Number.isInteger(c.expected_status) || Number(c.expected_status) < 100 || Number(c.expected_status) > 599)) ||
      (c.json_path !== undefined && (typeof c.json_path !== "string" || !Object.prototype.hasOwnProperty.call(c, "equals"))) || (c.contains !== undefined && typeof c.contains !== "string");
  })) return response("rejected", "invalid_checks", "Provide 1–10 checks with paths such as /health, optional expected_status, and optional json_path/equals or contains assertions.");
  const fetcher = options.fetchImpl ?? fetch;
  const results: Check[] = [];
  const evidence: VerityEvidence[] = [];
  for (let i = 0; i < checks.length; i++) {
    const c = obj(checks[i]), path = c.path as string;
    const name = typeof c.name === "string" && c.name.trim() ? c.name.trim().slice(0, 100) : `check-${i + 1}`;
    const expected = typeof c.expected_status === "number" ? c.expected_status : 200;
    try {
      const target = new URL(path, base);
      if (target.origin !== base.origin) throw new Error("Check path must remain on the allowlisted origin.");
      const res = await fetcher(target, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(5000) });
      const text = (await res.text()).slice(0, 200000);
      let body: unknown = text;
      try { body = JSON.parse(text); } catch { /* response may be plain text */ }
      let passed = res.status === expected;
      let detail = `HTTP status ${res.status}; expected ${expected}.`;
      if (passed && typeof c.json_path === "string") {
        passed = JSON.stringify(atPath(body, c.json_path)) === JSON.stringify(c.equals);
        detail += passed ? ` JSON field ${c.json_path} matched.` : ` JSON field ${c.json_path} mismatched.`;
      }
      if (passed && typeof c.contains === "string") {
        passed = text.includes(c.contains);
        detail += passed ? " Expected text found." : " Expected text not found.";
      }
      results.push({ name, path, status: passed ? "passed" : "failed", actual_status: res.status, expected_status: expected, detail });
      evidence.push({ source_id: `regression:${base.hostname}:${name}`, source_type: "live-regression-probe", title: name, url: target.toString(), excerpt: detail, retrieved_at: retrievedAt, metadata: { actual_status: res.status, expected_status: expected, passed } });
    } catch (err) {
      results.push({ name, path, status: "error", expected_status: expected, detail: err instanceof Error ? err.message.slice(0, 300) : "Request failed." });
    }
  }
  const passed = results.filter(x => x.status === "passed").length;
  const failed = results.filter(x => x.status === "failed").length;
  const errors = results.filter(x => x.status === "error").length;
  return {
    intent: "REGRESSION_VERIFY", verdict: passed === results.length ? "confirmed" : passed ? "uncertain" : "not_found",
    confidence: passed === results.length ? 0.9 : 0.75,
    answer: { checks_run: results.length, passed, failed, errors, results, execution_mode: "allowlisted_https_get" }, evidence,
    uncertainty: [{ code: "http_probe_scope_only", message: "Runs allowlisted HTTPS GET probes with response assertions only. It does not execute a code test suite, mutate the target, or prove a build is regression-free." }],
    retrieved_at: retrievedAt
  };
}
