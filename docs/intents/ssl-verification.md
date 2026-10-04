# SSL_VERIFICATION

SSL_VERIFICATION is Verity's second deterministic cybersecurity Intent.

The current Telegraph Intent catalogue classifies it as Cybersecurity / Deterministic.

## Behavior

The implementation opens a TLS connection to the requested hostname and port with the hostname supplied as TLS SNI and certificate verification enabled.

A successful authorized handshake produces structured certificate and connection metadata.

## Output

The result may contain the hostname, port, authorization state, negotiated TLS protocol and cipher, certificate subject and issuer, validity period, SHA-256 fingerprint, serial number, subject alternative names, and authorization error.

## Safety

Certificate verification is not disabled to manufacture a successful result.

TLS/network failures are operational errors. An unauthorized certificate is returned as a rejected verification result with explicit uncertainty.

## Protocol boundary

This is an internal Verity Intent implementation. It does not define Telegraph Miner YAML or claim these fields are required by Telegraph.
