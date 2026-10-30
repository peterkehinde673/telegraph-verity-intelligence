# RESEARCH_QUERY

`RESEARCH_QUERY` is an approved research-oriented Intent in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent retrieves relevant research results for a query. It does not synthesize the retrieved material into a new conclusion; that belongs to the separate research-synthesis layer.

Each result preserves:

- title;
- URL;
- source identifier;
- optional excerpt;
- optional publication time.

## Result states

- At least one result -> `confirmed`
- No results -> `insufficient_evidence`
- Empty query -> `rejected`
- Missing or failed search source -> `insufficient_evidence`

The search implementation is injected through `searchImpl`.
