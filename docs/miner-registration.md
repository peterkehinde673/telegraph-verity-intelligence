# Telegraph Miner registration

This project keeps the registration YAML as `miner.yaml` only when a real, verified Miner ID is available.

## Pre-registration checks

1. Deploy the API and confirm Render reports the service as live.
2. Confirm the API exposes:
   - `GET /health`
   - `GET /intents`
   - `POST /v1/intent`
3. Verify the 20 declared Intents against Telegraph's current canonical Intent set.
4. Query the live Miner catalogue and choose an ID only after confirming it is unused.
5. Copy `miner.yaml.template` to `miner.yaml` and replace only the Miner ID placeholder.
6. Run the official Telegraph validation API through:
   `npm run validate:miner`
7. If a miner wallet address is available, pass it through `TELEGRAPH_MINER_ADDRESS` so the validator can also check identity/ID conflicts.
8. Do not register until validation returns `valid: true` and no endpoint result reports `success: false`.

## Live-state verification

The repository includes:

```bash
node scripts/verify-telegraph-registration.mjs
```

This checks the current canonical Intent catalogue.

After independently selecting a candidate Miner ID:

```bash
node scripts/verify-telegraph-registration.mjs <MINER_ID>
```

The script fails if the supplied ID is already present in the live Miner catalogue.

Do not use Sentinel's Miner ID or any ID inferred from old examples.

## Validation

With a final `miner.yaml`:

```bash
npm run validate:miner
```

Optional validator inputs:

```export TELEGRAPH_VALIDATION_API_KEY=...
export TELEGRAPH_MINER_ADDRESS=0x...
npm run validate:miner
```

The validator is the final schema/endpoint gate before registration. Registration itself is on-chain and should only happen after the YAML has passed validation.
