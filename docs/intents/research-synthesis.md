# RESEARCH_SYNTHESIS

`RESEARCH_SYNTHESIS` is an approved research-oriented Intent in the current Telegraph catalogue. citeturn0search0

## Scope

This Intent synthesizes a conclusion from explicitly supplied research evidence. It does not silently perform retrieval: source evidence must be provided to the synthesis implementation.

The response preserves:

- the research question;
- the synthesized conclusion;
- key points;
- the source evidence and provenance.

## Anti-hallucination behavior

- No supplied evidence -> `insufficient_evidence`
- No configured synthesizer -> `insufficient_evidence`
- Empty synthesis -> `insufficient_evidence`
- Empty question -> `rejected`

The synthesis implementation receives only normalized source fields and must ground its conclusion in those sources.
