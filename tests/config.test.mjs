import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../dist/config.js";

test("configuration uses safe defaults", () => {
  const config = loadConfig({});
  assert.deepEqual(config, {
    port: 3000,
    maxBodyBytes: 1_048_576,
    environment: "development"
  });
});

test("configuration accepts valid runtime values", () => {
  const config = loadConfig({
    PORT: "8080",
    VERITY_MAX_BODY_BYTES: "2048",
    NODE_ENV: "production"
  });

  assert.deepEqual(config, {
    port: 8080,
    maxBodyBytes: 2048,
    environment: "production"
  });
});

test("invalid numeric configuration falls back safely", () => {
  const config = loadConfig({
    PORT: "-1",
    VERITY_MAX_BODY_BYTES: "not-a-number",
    NODE_ENV: "unexpected"
  });

  assert.equal(config.port, 3000);
  assert.equal(config.maxBodyBytes, 1_048_576);
  assert.equal(config.environment, "development");
});
