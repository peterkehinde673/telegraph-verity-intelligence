import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { VERITY_INTENTS } from "../dist/intents/catalogue.js";

function listFrom(text, pattern) {
  const match = text.match(pattern);
  assert.ok(match, "expected intent list to exist");
  return match[1].split(",").map(value => value.trim()).filter(Boolean);
}

function manifestIntentLists(text) {
  const endpoint = listFrom(text, /^    intents: \[([^\]]+)\]$/m);
  const enumBlock = text.match(/^    intent:\n      type: string\n      enum:\n((?:        - [A-Z0-9_]+\n)+)/m);
  assert.ok(enumBlock, "expected input_schema intent enum");
  const inputSchema = [...enumBlock[1].matchAll(/^        - ([A-Z0-9_]+)$/gm)].map(match => match[1]);
  const supportedBlock = text.match(/^  supported_intents:\n((?:    - [A-Z0-9_]+\n)+)/m);
  assert.ok(supportedBlock, "expected semantics.supported_intents");
  const supported = [...supportedBlock[1].matchAll(/^    - ([A-Z0-9_]+)$/gm)].map(match => match[1]);
  return [endpoint, inputSchema, supported];
}

test("new search intents stay local until manifest gates pass; original 29 stay consistent", async () => {
  const unadvertised = ["NEWS_SEARCH", "WEB_SEARCH", "TWITTER_SEARCH", "SENTIMENT_ANALYSIS"];
  const expected = VERITY_INTENTS.filter(intent => !unadvertised.includes(intent));
  assert.equal(expected.length, 29);

  for (const path of ["miner.yaml", "miner.yaml.template"]) {
    const text = await readFile(path, "utf8");
    for (const list of manifestIntentLists(text)) {
      assert.deepEqual(list, expected, `${path} intent list`);
      for (const intent of unadvertised) assert.equal(list.includes(intent), false);
    }
  }
});
