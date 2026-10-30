# FACT_CHECK public diagnostic corpus

This corpus is a **public, synthetic diagnostic suite**, not Telegraph's hidden 15-case promotion benchmark. It is intended to expose case-level inversions on negation, numeric conflicts, entity conflicts, partial answers, paraphrases, and unrelated responses.

The suite is informed by the public hackathon checker `neromtoobad/telegraph-wasm-check` (MIT, commit `1685e5372cc83b9ae4f58a5d85f0cf81a43ac390`), especially its documented hard probes for negation and wrong-entity answers. Original case wording below is authored for this repository.

Because the official benchmark is not published, passing these cases cannot predict promotion. The goal is to compare candidate and active champion on identical examples and inspect regressions before paying gas.
