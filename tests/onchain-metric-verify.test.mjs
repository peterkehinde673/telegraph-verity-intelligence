import test from "node:test";
import assert from "node:assert/strict";
import { onchainMetricVerify } from "../dist/intents/onchain-metric-verify.js";
import { ethereumTransactionGasUsed, parseBlockNumber } from "../dist/providers/ethereum-rpc.js";

const hash = `0x${"a".repeat(64)}`;
const blockHash = `0x${"b".repeat(64)}`;
const request = { metric: "transaction_gas_used", transaction_hash: hash, block_number: "21000000" };
const receipt = {
  transactionHash: hash,
  blockHash,
  blockNumber: "0x1406f40",
  gasUsed: "0x5208"
};

function jsonResponse(result, id = 1) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    headers: { "content-type": "application/json" }
  });
}

test("block number parser accepts bounded canonical decimal integers", () => {
  assert.equal(parseBlockNumber("0"), 0n);
  assert.equal(parseBlockNumber("21000000"), 21000000n);
  for (const input of ["", "01", "-1", "latest", "1e3", "18446744073709551616"]) {
    assert.equal(parseBlockNumber(input), null, input);
  }
});

test("provider checks mainnet then retrieves and validates the receipt", async () => {
  const calls = [];
  const result = await ethereumTransactionGasUsed(hash, 21000000n, {
    rpcUrl: "https://rpc.example.test",
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body);
      calls.push({ url: String(url), method: body.method, params: body.params, redirect: options.redirect });
      return body.method === "eth_chainId" ? jsonResponse("0x1", body.id) : jsonResponse(receipt, body.id);
    }
  });
  assert.deepEqual(calls.map(call => call.method), ["eth_chainId", "eth_getTransactionReceipt"]);
  assert.deepEqual(calls[1].params, [hash]);
  assert.ok(calls.every(call => call.redirect === "error"));
  assert.equal(result.gas_used, "21000");
  assert.equal(result.block_number, "21000000");
  assert.equal(result.rpc_host, "rpc.example.test");
});

test("provider rejects wrong chain, RPC errors, and malformed receipts", async () => {
  const replies = [
    ["0x5", 1],
    ["0x1", 1, { jsonrpc: "2.0", id: 2, error: { code: -1, message: "private detail" } }],
    ["0x1", 1, { jsonrpc: "2.0", id: 2, result: { ...receipt, gasUsed: "0x01" } }]
  ];
  for (const [chainId, , badReceipt] of replies) {
    let calls = 0;
    await assert.rejects(ethereumTransactionGasUsed(hash, 21000000n, {
      rpcUrl: "https://rpc.example.test",
      fetchImpl: async (_url, options) => {
        const body = JSON.parse(options.body);
        calls += 1;
        if (body.method === "eth_chainId") return jsonResponse(chainId, body.id);
        return badReceipt ? new Response(JSON.stringify(badReceipt)) : jsonResponse(receipt, body.id);
      }
    }));
    if (chainId !== "0x1") assert.equal(calls, 1, "wrong chain must stop before receipt lookup");
  }
  await assert.rejects(ethereumTransactionGasUsed(hash, 1n, { rpcUrl: "http://127.0.0.1:8545" }));
  await assert.rejects(ethereumTransactionGasUsed(hash, 1n, {
    rpcUrl: "https://user:password@rpc.example.test/secret?key=private"
  }));
  await assert.rejects(ethereumTransactionGasUsed(hash, 1n, {
    rpcUrl: "https://rpc.example.test",
    fetchImpl: async () => new Response("not-json")
  }));
});

test("provider treats missing or differently anchored receipts as unavailable", async () => {
  const noReceipt = await ethereumTransactionGasUsed(hash, 21000000n, {
    rpcUrl: "https://rpc.example.test",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      return jsonResponse(body.method === "eth_chainId" ? "0x1" : null, body.id);
    }
  });
  assert.equal(noReceipt, null);

  const otherBlock = await ethereumTransactionGasUsed(hash, 21000000n, {
    rpcUrl: "https://rpc.example.test",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      return jsonResponse(body.method === "eth_chainId" ? "0x1" : { ...receipt, blockNumber: "0x1" }, body.id);
    }
  });
  assert.equal(otherBlock, null);
});

test("provider bounds response bodies and gives each RPC call a timeout", async () => {
  let receivedSignal;
  await assert.rejects(ethereumTransactionGasUsed(hash, 21000000n, {
    rpcUrl: "https://rpc.example.test",
    fetchImpl: async (_url, options) => {
      receivedSignal = options.signal;
      return new Response(" ".repeat(300 * 1024));
    }
  }));
  assert.ok(receivedSignal instanceof AbortSignal);
  assert.ok(receivedSignal.aborted === false);
});

test("handler validates inputs before provider access and abstains when unconfigured or absent", async () => {
  let calls = 0;
  const lookupImpl = async () => { calls += 1; return null; };
  for (const input of [null, {}, { ...request, transaction_hash: "bad" }, { ...request, block_number: "latest" }, { ...request, metric: "wallet_balance" }]) {
    const result = await onchainMetricVerify(input, { lookupImpl });
    assert.equal(result.intent, "ONCHAIN_METRIC_VERIFY");
    assert.ok(["rejected", "insufficient_evidence"].includes(result.verdict));
  }
  assert.equal(calls, 0);
  assert.equal((await onchainMetricVerify(request)).verdict, "insufficient_evidence");
  assert.equal((await onchainMetricVerify(request, { lookupImpl })).uncertainty[0].code, "receipt_not_found_at_block");
  assert.equal(calls, 1);
});

test("handler returns attributed receipt evidence and reports expected-value mismatches", async () => {
  const result = await onchainMetricVerify({ ...request, expected_gas_used: "21001" }, {
    now: () => "2026-10-19T00:00:00.000Z",
    lookupImpl: async () => ({
      transaction_hash: hash,
      block_number: "21000000",
      block_hash: blockHash,
      gas_used: "21000",
      rpc_host: "rpc.example.test"
    })
  });
  assert.equal(result.verdict, "confirmed");
  assert.equal(result.answer.gas_used, "21000");
  assert.equal(result.answer.matches_expected, false);
  assert.equal(result.evidence.length, 1);
  assert.equal(result.evidence[0].source_type, "ethereum-json-rpc");
  assert.match(result.evidence[0].excerpt, /rpc\.example\.test/);
  assert.equal("url" in result.evidence[0], false, "do not imply an explorer supplied RPC evidence");
  assert.ok(result.uncertainty.some(item => item.code === "configured_rpc_is_the_data_source"));
  assert.ok(result.uncertainty.some(item => item.code === "expected_value_mismatch"));
});

test("handler sanitizes RPC failures", async () => {
  const result = await onchainMetricVerify(request, { lookupImpl: async () => { throw new Error("secret endpoint token"); } });
  assert.equal(result.verdict, "insufficient_evidence");
  assert.doesNotMatch(JSON.stringify(result), /secret endpoint token/);
});
