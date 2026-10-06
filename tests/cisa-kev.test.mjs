import test from "node:test";
import assert from "node:assert/strict";
import { lookupKev } from "../dist/providers/cisa-kev.js";

test("CISA KEV lookup finds a matching CVE", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    vulnerabilities: [{ cveID: "CVE-2026-1234", vendorProject: "Example", product: "Example Product", dateAdded: "2026-10-01", dueDate: "2026-10-21", knownRansomwareCampaignUse: "Known" }]
  }), { status: 200 });
  try {
    const result = await lookupKev("cve-2026-1234");
    assert.equal(result?.vendorProject, "Example");
    assert.equal(result?.knownRansomwareCampaignUse, "Known");
  } finally { globalThis.fetch = original; }
});

test("CISA KEV lookup returns null for a CVE absent from the catalogue", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ vulnerabilities: [] }), { status: 200 });
  try {
    assert.equal(await lookupKev("CVE-2026-9999"), null);
  } finally { globalThis.fetch = original; }
});
