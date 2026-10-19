const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_BLOCK_NUMBER = (1n << 64n) - 1n;

export interface EthereumReceiptMetric {
  transaction_hash: string;
  block_number: string;
  block_hash: string;
  gas_used: string;
  rpc_host: string;
}

export interface EthereumRpcOptions {
  rpcUrl: string;
  fetchImpl?: typeof fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readJsonLimited(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("Ethereum RPC returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("Ethereum RPC response exceeded the configured limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString("utf8"));
}

function quantity(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

export function parseBlockNumber(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]{0,19})$/.test(value)) return null;
  try {
    const parsed = BigInt(value);
    return parsed <= MAX_BLOCK_NUMBER ? parsed : null;
  } catch {
    return null;
  }
}

async function rpcCall(
  endpoint: URL,
  method: "eth_chainId" | "eth_getTransactionReceipt",
  params: unknown[],
  id: number,
  fetchImpl: typeof fetch
): Promise<unknown> {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Ethereum RPC returned HTTP ${response.status}.`);
  const payload: unknown = await readJsonLimited(response);
  if (!isRecord(payload) || payload.jsonrpc !== "2.0" || payload.id !== id || "error" in payload || !("result" in payload)) {
    throw new Error("Ethereum RPC returned an invalid JSON-RPC response.");
  }
  return payload.result;
}

export async function ethereumTransactionGasUsed(
  transactionHash: string,
  expectedBlock: bigint,
  options: EthereumRpcOptions
): Promise<EthereumReceiptMetric | null> {
  let endpoint: URL;
  try {
    endpoint = new URL(options.rpcUrl);
  } catch {
    throw new Error("Ethereum RPC endpoint is invalid.");
  }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.hash) {
    throw new Error("Ethereum RPC endpoint must be an HTTPS URL without embedded credentials or a fragment.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const chainId = quantity(await rpcCall(endpoint, "eth_chainId", [], 1, fetchImpl));
  if (chainId !== 1n) throw new Error("The configured Ethereum RPC endpoint is not connected to Ethereum mainnet.");

  const receipt = await rpcCall(endpoint, "eth_getTransactionReceipt", [transactionHash], 2, fetchImpl);
  if (receipt === null) return null;
  if (!isRecord(receipt) ||
      typeof receipt.transactionHash !== "string" || receipt.transactionHash.toLowerCase() !== transactionHash.toLowerCase() ||
      typeof receipt.blockHash !== "string" || !/^0x[0-9a-f]{64}$/i.test(receipt.blockHash)) {
    throw new Error("Ethereum RPC returned a malformed transaction receipt.");
  }
  const blockNumber = quantity(receipt.blockNumber);
  const gasUsed = quantity(receipt.gasUsed);
  if (blockNumber === null || gasUsed === null) throw new Error("Ethereum RPC receipt omitted a valid block number or gas-used value.");
  if (blockNumber !== expectedBlock) return null;

  return {
    transaction_hash: transactionHash.toLowerCase(),
    block_number: blockNumber.toString(10),
    block_hash: receipt.blockHash.toLowerCase(),
    gas_used: gasUsed.toString(10),
    rpc_host: endpoint.hostname
  };
}
