const KEV_ENDPOINT = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

export interface KevEntry {
  cveID?: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
  shortDescription?: string;
}

export async function lookupKev(
  cveId: string,
  fetchImpl: typeof fetch = fetch
): Promise<KevEntry | null> {
  const response = await fetchImpl(KEV_ENDPOINT, {
    headers: { accept: "application/json", "user-agent": "telegraph-verity-intelligence/0.1" },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`CISA KEV request failed with HTTP ${response.status}.`);

  const payload = await response.json() as { vulnerabilities?: KevEntry[] };
  return payload.vulnerabilities?.find((entry) => entry.cveID?.toUpperCase() === cveId.toUpperCase()) ?? null;
}
