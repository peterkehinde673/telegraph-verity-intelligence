# Evidence and Provenance Engine

The evidence layer is shared infrastructure for Verity's future Intent implementations.

## Responsibilities

1. Normalize source records into a stable internal shape.
2. Preserve source identity and retrieval timestamps.
3. Keep optional publication metadata when supplied.
4. Remove duplicate evidence records using stable provenance fields.
5. Produce a compact provenance summary for downstream responses.

## Source identity

An evidence record requires:

- `source_id`
- `source_type`
- `retrieved_at`

URLs, titles, excerpts, publication timestamps, and metadata are optional because not every source will expose all of them.

## Deduplication

The current deterministic deduplication key is:

`source_id | url | retrieved_at`

This is deliberately conservative. Two records from the same source at different retrieval times are not automatically treated as duplicates.

## Boundaries

The evidence layer does not:

- decide whether a claim is true;
- assign a confidence score;
- call external providers;
- implement a Telegraph Intent;
- define Telegraph Miner YAML;
- define an Evaluator or WASM module.

Those responsibilities belong to higher layers.
