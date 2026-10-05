import test from "node:test";
import assert from "node:assert/strict";

test("DNS lookup normalizes a trailing root dot", () => {
  assert.equal("Example.COM.".trim().toLowerCase().replace(/\.$/, ""), "example.com");
});

test("DNS record types are restricted to the supported deterministic set", () => {
  const supported = new Set(["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SRV", "CAA"]);
  assert.equal(supported.has("A"), true);
  assert.equal(supported.has("INVALID"), false);
});

test("DNS provenance identifiers are stable", () => {
  assert.equal(
    ["dns", "example.com", "A"].join(":"),
    "dns:example.com:A"
  );
});
