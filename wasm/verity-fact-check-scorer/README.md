# Verity FACT_CHECK WASM scorer (prototype)

This crate builds a standalone Telegraph scoring module for the canonical `FACT_CHECK` intent.

## Important distinction

This WASM module is a **scorer**, not the Verity Miner API and not a fact-checking engine. Telegraph passes it a question, a ground-truth answer, and a miner answer; it returns a score from 0 to 1. It cannot make network requests or retrieve evidence inside the WASM sandbox.

The current algorithm is a deterministic lexical-overlap baseline using token precision/recall F1. It is intentionally small and reproducible, but lexical overlap is not semantic verification. Treat it as a prototype until benchmark testing demonstrates that it meets or beats the active FACT_CHECK champion. Do not register it solely because it compiles.

## Build

Install Rust and the WASM target:

```sh
rustup target add wasm32-unknown-unknown
cargo test --manifest-path wasm/verity-fact-check-scorer/Cargo.toml
cargo build --manifest-path wasm/verity-fact-check-scorer/Cargo.toml --release --target wasm32-unknown-unknown
```

The binary is:

```
wasm/verity-fact-check-scorer/target/wasm32-unknown-unknown/release/verity_fact_check_scorer.wasm
```

Build only for `wasm32-unknown-unknown`, not a WASI target. The module must export `alloc`, `dealloc`, and `rank_answer`, have no OS/WASI imports, and remain under Telegraph's 32 MB limit.

## Before registration

1. Check the live canonical intent set and inspect the active scorer at `https://devnode.telegraphprotocol.com/engine/v1/intents/FACT_CHECK/wasm`.
2. Run local tests and Telegraph's WASM validation/benchmark flow.
3. Confirm the candidate can beat the active scorer or default baseline.
4. Upload the exact compiled bytes to a stable public URL.
5. Compute the WASM hash with **Keccak-256**, not SHA-256. This differs from the SHA-256 hash used for the Miner YAML.
6. Register through `https://integrate.telegraphprotocol.com/wasm` only after tests and benchmark checks pass.

Official guide: https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module
