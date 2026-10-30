# EMAIL_SECURITY

EMAIL_SECURITY is a hybrid cybersecurity Intent in the current Telegraph catalogue. It has no commercial mission usage in the current catalogue, but that does not imply that no Miner has ever implemented it. citeturn0search0

## Scope

Verity evaluates domain-level email security posture using DNS evidence:

- MX records;
- SPF records;
- DMARC records and policy.

It does **not** verify that a particular mailbox exists, that an email message is legitimate, or that a sender is malicious.

## Result states

- All required DNS signals present -> `confirmed`
- Missing security signals -> `uncertain`
- Invalid domain input -> `rejected`
- DNS/provider failure -> `error`

The result contains the underlying records so an evaluator can reproduce the classification.

## Protocol boundary

This is an internal Verity Intent implementation. Telegraph's Intent catalogue defines the Intent and class; it does not require this exact response schema.
