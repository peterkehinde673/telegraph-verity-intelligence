import test from "node:test";
import assert from "node:assert/strict";
import { parseMinerValidationResponse } from "../scripts/parse-miner-validation-response.mjs";

test("miner validator rejects the Developer Console HTML response without exposing its body", async () => {
  const secretMarker = "do-not-print-this-response-body";
  const response = new Response(`<!doctype html><title>Telegraph Developer Console</title>${secretMarker}`, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" }
  });

  await assert.rejects(
    parseMinerValidationResponse(response),
    error => {
      assert.match(error.message, /HTTP 404/);
      assert.match(error.message, /text\/html/);
      assert.doesNotMatch(error.message, new RegExp(secretMarker));
      return true;
    }
  );
});

test("miner validator rejects malformed JSON without exposing its body", async () => {
  const secretMarker = "private-response-fragment";
  const response = new Response(`{${secretMarker}`, {
    status: 502,
    headers: { "content-type": "application/json" }
  });

  await assert.rejects(
    parseMinerValidationResponse(response),
    error => {
      assert.match(error.message, /malformed JSON/);
      assert.doesNotMatch(error.message, new RegExp(secretMarker));
      return true;
    }
  );
});

test("miner validator requires a boolean valid field in a JSON response", async () => {
  const response = new Response(JSON.stringify({ slug: "example" }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });

  await assert.rejects(parseMinerValidationResponse(response), /boolean valid field/);
});

test("miner validator accepts the documented JSON response envelope", async () => {
  const expected = { valid: true, slug: "example", results: [] };
  const response = new Response(JSON.stringify(expected), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });

  assert.deepEqual(await parseMinerValidationResponse(response), expected);
});
