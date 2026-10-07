import test from "node:test";
import assert from "node:assert/strict";
import { INTENT_HANDLERS } from "../dist/intent-handlers.js";
import { VERITY_INTENTS } from "../dist/intents/catalogue.js";
import { validateVerityResponse } from "../dist/contracts/verity-response.js";

test("all scoped Intents have a callable deterministic handler", async () => {
  for (const intent of VERITY_INTENTS) {
    const handler = INTENT_HANDLERS[intent];
    assert.equal(typeof handler, "function", `${intent} must have a handler`);

    const result = await handler({});
    assert.equal(result.intent, intent);
    assert.deepEqual(validateVerityResponse(result), [], `${intent} must return the Verity response contract`);
  }
});
