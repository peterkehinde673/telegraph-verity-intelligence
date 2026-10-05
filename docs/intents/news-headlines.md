# NEWS_HEADLINES

`NEWS_HEADLINES` is an approved AI & Machine Learning Hybrid Intent in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent retrieves current headlines for a topic from a configured news source. It returns source-backed headline records rather than generating or ranking stories itself.

Each headline preserves:

- title;
- URL;
- source identifier;
- publication timestamp when available.

Retrieval time is also recorded in the shared response envelope.

## Result states

- At least one headline -> `confirmed`
- No headlines -> `insufficient_evidence`
- Empty topic -> `rejected`
- Missing or failed source -> `insufficient_evidence`

A returned headline is not treated as proof that every claim contained in the underlying article is true.
