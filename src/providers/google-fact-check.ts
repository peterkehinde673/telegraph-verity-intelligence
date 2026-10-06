const ENDPOINT = "https://factchecktools.googleapis.com/v1alpha1/claims:search";

export interface GoogleFactCheckReview {
  publisher?: { name?: string; site?: string };
  url?: string;
  title?: string;
  reviewDate?: string;
  textualRating?: string;
  languageCode?: string;
}

export interface GoogleFactCheckResult {
  text?: string;
  claimant?: string;
  claimDate?: string;
  claimReview?: GoogleFactCheckReview[];
}

export async function googleFactCheck(
  claim: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<GoogleFactCheckResult[]> {
  if (!apiKey.trim()) throw new Error("Google Fact Check API key is required.");

  const url = new URL(ENDPOINT);
  url.searchParams.set("query", claim);
  url.searchParams.set("languageCode", "en");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("key", apiKey);

  const response = await fetchImpl(url, {
    headers: { accept: "application/json", "user-agent": "telegraph-verity-intelligence/0.1" },
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new Error(`Google Fact Check request failed with HTTP ${response.status}.`);
  }

  const payload = await response.json() as { claims?: GoogleFactCheckResult[] };
  return payload.claims ?? [];
}
