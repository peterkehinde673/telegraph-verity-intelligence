# ACADEMIC_SEARCH

`ACADEMIC_SEARCH` is an approved research-oriented Intent in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent retrieves scholarly search results from a configured academic source. It does not synthesize findings or infer the correctness of a paper's conclusions.

Each result preserves:

- title;
- URL;
- source identifier;
- authors when available;
- publication timestamp when available;
- abstract when available.

Abstract text is retained as evidence excerpt where supplied.

## Result states

- At least one academic result -> `confirmed`
- No results -> `insufficient_evidence`
- Empty query -> `rejected`
- Missing or failed source -> `insufficient_evidence`
