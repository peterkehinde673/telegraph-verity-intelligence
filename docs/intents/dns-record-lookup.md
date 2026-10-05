# DNS_RECORD_LOOKUP

DNS_RECORD_LOOKUP is Verity's third deterministic cybersecurity Intent.

The current Telegraph Intent catalogue classifies it as Cybersecurity / Deterministic. citeturn0search0

## Behavior

The implementation uses Node's system DNS resolver and supports:

- A
- AAAA
- CNAME
- MX
- NS
- TXT
- SRV
- CAA

A hostname is normalized to lowercase and a trailing DNS root dot is removed.

## Result states

- Valid records -> `confirmed`
- No records / hostname not found -> `not_found`
- Invalid hostname or unsupported record type -> `rejected`
- Other resolver failures -> operational errors

The result includes the exact requested record type, returned records, retrieval timestamp, and DNS provenance.

## Protocol boundary

This is an internal Verity Intent implementation. It does not define Telegraph Miner YAML or claim these fields are required by Telegraph.
