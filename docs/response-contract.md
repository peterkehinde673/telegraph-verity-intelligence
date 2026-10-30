# Verity Response Contract

This is an internal Verity application contract. It is not presented as a Telegraph protocol schema or registration requirement.

## Purpose

Every implemented Intent should return enough structured information to make its result:

- reproducible;
- evidence-backed;
- explicit about uncertainty;
- safe to abstain when evidence is inadequate;
- straightforward to test and normalize.

Telegraph treats Intents as shared intelligence units and evaluates Miners per Intent. Verity therefore keeps this response contract independent from any future Telegraph YAML or evaluator implementation.

## Response shape

A Verity response contains:

- `intent`: one of the project's selected canonical Intent names;
- `verdict`: a normalized outcome;
- `confidence`: a number from 0 to 1;
- `answer`: Intent-specific structured data;
- `evidence`: source records supporting the answer;
- `uncertainty`: explicit limitations or unresolved issues;
- `retrieved_at`: retrieval timestamp.

## Abstention

Verity must not manufacture certainty when evidence is inadequate.

Use:

- `insufficient_evidence` when available evidence cannot support a defensible conclusion;
- `not_found` when the requested subject or record could not be located;
- `uncertain` when evidence exists but does not justify a stronger conclusion.

A high confidence score must never be used to disguise missing evidence.

## Evidence

Evidence records should identify the source and retrieval time. Where applicable, they may also include:

- source URL;
- title;
- relevant excerpt;
- publication time;
- structured metadata.

Future Intent implementations should prefer stable source identifiers and deterministic normalization.

## Protocol boundary

This contract is internal to Verity.

It does not imply that Telegraph requires these exact JSON fields. Telegraph's official documentation defines the shared Intent network and the separate Miner/Evaluator roles; Verity's application contract sits behind that integration boundary.
