# Runtime configuration

Verity keeps deployment configuration separate from Intent logic.

| Variable | Default | Purpose |
|---|---:|---|
| `PORT` | `3000` | HTTP listener port |
| `VERITY_MAX_BODY_BYTES` | `1048576` | Maximum JSON request body size |
| `NODE_ENV` | `development` | Runtime environment |

Provider credentials are intentionally **not** added to this configuration yet. Each external provider will be introduced only when its corresponding Intent has a defined source, normalization rule, timeout policy, and test strategy.

Secrets must be supplied through the deployment environment, never committed to Git.
