# URL_SCAN

URL_SCAN is Verity's fourth deterministic cybersecurity Intent.

The current Telegraph Intent catalogue classifies URL_SCAN as Cybersecurity / Deterministic. citeturn0search0

## Behavior

The implementation validates an HTTP(S) URL and performs a bounded HTTP request with redirects handled explicitly.

It records:

- final URL;
- HTTP status;
- content type;
- redirect count;
- redirect destinations;
- hostname;
- retrieval provenance.

## SSRF boundary

Because this service is intended to be deployed as a public Miner, URL scanning must not become an unrestricted request proxy.

The implementation therefore:

- accepts only HTTP and HTTPS;
- rejects literal private, loopback, unspecified, link-local, and carrier-grade NAT IPv4 targets;
- resolves hostnames before each request;
- rejects hostnames that resolve to non-public addresses;
- does not allow automatic redirects;
- revalidates every redirect target;
- enforces a redirect limit;
- enforces a request timeout.

## Result states

- Successful 2xx response -> `confirmed`
- Non-2xx response -> `uncertain`
- Invalid URL or unsafe target -> `rejected`
- Redirect limit exceeded -> `uncertain`

This Intent reports observable HTTP behavior. It does not claim that a 2xx response proves that a URL is malware-free or safe in every sense.
