import type { VerityResponse } from "../contracts/verity-response.js";
import { normalizeEvidence } from "../evidence/normalize.js";
import { ethereumTransactionGasUsed, parseBlockNumber, type EthereumRpcOptions } from "../providers/ethereum-rpc.js";

const HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const DECIMAL_PATTERN = /^(?:0|[1-9][0-9]{0,39})$/;

export interface OnchainMetricAnswer {
  network: "ethereum-mainnet";
  metric: "transaction_gas_used";
  transaction_hash: string;
  block_number: string;
  gas_used: string | null;
  expected_gas_used: string | null;
  matches_expected: boolean | null;
}

export interface OnchainMetricVerifyOptions extends Partial<EthereumRpcOptions> {
  lookupImpl?: (transactionHash: string, blockNumber: bigint) => Promise<Awaited<ReturnType<typeof ethereumTransactionGasUsed>>>;
  now?: () => string;
}

function emptyAnswer(transactionHash = "", blockNumber = "", expected: string | null = null): OnchainMetricAnswer {
  return {
    network: "ethereum-mainnet",
    metric: "transaction_gas_used",
    transaction_hash: transactionHash,
    block_number: blockNumber,
    gas_used: null,
    expected_gas_used: expected,
    matches_expected: null
  };
}

function abstain(
  answer: OnchainMetricAnswer,
  retrievedAt: string,
  code: string,
  message: string
): VerityResponse<OnchainMetricAnswer> {
  return {
    intent: "ONCHAIN_METRIC_VERIFY",
    verdict: "insufficient_evidence",
    confidence: 0,
    answer,
    evidence: [],
    uncertainty: [{ code, message }],
    retrieved_at: retrievedAt
  };
}

export async function onchainMetricVerify(input: unknown, options: OnchainMetricVerifyOptions = {}): Promise<VerityResponse<OnchainMetricAnswer>> {
  const value = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const transactionHash = typeof value.transaction_hash === "string" ? value.transaction_hash.trim() : "";
  const blockText = typeof value.block_number === "string" ? value.block_number.trim() : "";
  const blockNumber = parseBlockNumber(blockText);
  const expected = typeof value.expected_gas_used === "string" ? value.expected_gas_used.trim() : null;
  const retrievedAt = options.now?.() ?? new Date().toISOString();
  const answer = emptyAnswer(transactionHash.toLowerCase(), blockText, expected);

  if (value.metric !== "transaction_gas_used") {
    return {
      intent: "ONCHAIN_METRIC_VERIFY", verdict: "rejected", confidence: 1, answer, evidence: [],
      uncertainty: [{ code: "unsupported_metric", message: "This implementation supports only the transaction_gas_used metric." }],
      retrieved_at: retrievedAt
    };
  }
  if (!HASH_PATTERN.test(transactionHash) || blockNumber === null ||
      (expected !== null && !DECIMAL_PATTERN.test(expected))) {
    return {
      intent: "ONCHAIN_METRIC_VERIFY", verdict: "rejected", confidence: 1, answer, evidence: [],
      uncertainty: [{ code: "invalid_metric_request", message: "Provide an Ethereum transaction hash, a decimal block number, and an optional non-negative decimal expected_gas_used value." }],
      retrieved_at: retrievedAt
    };
  }
  if (!options.lookupImpl && !options.rpcUrl?.trim()) {
    return abstain(answer, retrievedAt, "ethereum_rpc_unconfigured", "An Ethereum mainnet JSON-RPC endpoint is required for this lookup.");
  }

  try {
    const receipt = options.lookupImpl
      ? await options.lookupImpl(transactionHash, blockNumber)
      : await ethereumTransactionGasUsed(transactionHash, blockNumber, { rpcUrl: options.rpcUrl! });
    if (!receipt) return abstain(answer, retrievedAt, "receipt_not_found_at_block", "No transaction receipt was returned for this transaction at the requested block.");
    const gas = BigInt(receipt.gas_used);
    const matches = expected === null ? null : gas === BigInt(expected);
    const resultAnswer: OnchainMetricAnswer = {
      ...answer,
      transaction_hash: receipt.transaction_hash,
      block_number: receipt.block_number,
      gas_used: receipt.gas_used,
      matches_expected: matches
    };
    const evidence = normalizeEvidence({
      source_id: `ethereum-mainnet:receipt:${receipt.transaction_hash}:${receipt.block_hash}`,
      source_type: "ethereum-json-rpc",
      title: `Ethereum transaction receipt at block ${receipt.block_number}`,
      excerpt: `Transaction ${receipt.transaction_hash} was included in block ${receipt.block_number} (${receipt.block_hash}); gasUsed=${receipt.gas_used}. RPC node: ${receipt.rpc_host}.`,
      retrieved_at: retrievedAt
    });

    return {
      intent: "ONCHAIN_METRIC_VERIFY",
      verdict: "confirmed",
      confidence: 1,
      answer: resultAnswer,
      evidence: [evidence],
      uncertainty: [
        { code: "configured_rpc_is_the_data_source", message: "This result reflects the configured Ethereum RPC node; the receipt is not independently cross-checked against another node or a light client." },
        ...(matches === false ? [{ code: "expected_value_mismatch", message: "The retrieved gas-used value does not match the supplied expected_gas_used value." }] : [])
      ],
      retrieved_at: retrievedAt
    };
  } catch {
    return abstain(answer, retrievedAt, "ethereum_rpc_failed", "The configured Ethereum RPC endpoint could not return a valid mainnet transaction receipt.");
  }
}
