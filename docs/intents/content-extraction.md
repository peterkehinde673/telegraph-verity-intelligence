# CONTENT_EXTRACTION

`CONTENT_EXTRACTION` is an approved current Telegraph Intent. citeturn0search0

## Scope

This Intent extracts content from a supplied source through a configured extraction provider. It does not summarize, classify, verify, or interpret the extracted material.

The normalized answer preserves:

- source reference;
- extracted content;
- content type;
- title when available.

The extracted content is also retained as evidence with provenance and retrieval time.

## Result states

- Non-empty extracted content -> `confirmed`
- Empty extraction -> `insufficient_evidence`
- Empty source -> `rejected`
- Missing or failed extractor -> `insufficient_evidence`

Extraction success means content was retrieved; it does not establish that the content is accurate or trustworthy.
