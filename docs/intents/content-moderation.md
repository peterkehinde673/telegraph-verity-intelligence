# CONTENT_MODERATION

CONTENT_MODERATION is a moderation-oriented Hybrid Intent in the Telegraph catalogue.

## Scope

Verity delegates classification to a configured moderation provider and normalizes the result into explicit policy categories, scores, rationales, and evidence.

The initial contract supports:

- hate;
- harassment;
- violence;
- sexual;
- self-harm;
- illegal activity;
- spam;
- benign.

A provider can support additional internal labels later, but the normalized Verity response should remain stable.

## Result states

- A finding at or above the 0.5 threshold -> `confirmed`
- No flagged category -> `not_found`
- Empty content -> `rejected`
- Missing or failed classifier -> `insufficient_evidence`

A moderation result is a classification signal, not a claim about a person's intent or character.

## Provider boundary

The classifier is injected through `classifyImpl`. No specific external moderation vendor is required by this implementation.
