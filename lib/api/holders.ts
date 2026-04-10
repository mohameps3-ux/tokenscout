import axios from "axios";

// Etherscan - ERC20 holder count for Base/Ethereum
export async function fetchEtherscanHolderCount(
  address: string
): Promise<number | null> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get("https://api.basescan.org/api", {
      params: {
        module: "token",
        action: "tokenholderlist",
        contractaddress: address,
        page: 1,
        offset: 1,
        apikey: apiKey,
      },
      timeout: 8000,
    });

    if (response.data?.status === "1" && Array.isArray(response.data?.result)) {
      // Can't get total count from this endpoint easily, use transfer count as proxy
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

// Helius - Solana token holder count
export async function fetchHeliusHolderCount(
  mintAddress: string
): Promise<number | null> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        jsonrpc: "2.0",
        id: "tokenscout",
        method: "getTokenAccounts",
        params: {
          mint: mintAddress,
          limit: 1,
          cursor: undefined,
          options: { showZeroBalance: false },
        },
      },
      { timeout: 8000 }
    );

    // Helius doesn't return total count directly in this call
    // Use token supply info instead
    const supplyResponse = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        jsonrpc: "2.0",
        id: "supply",
        method: "getTokenSupply",
        params: [mintAddress],
      },
      { timeout: 8000 }
    );

    // Estimate holders from accounts response
    if (response.data?.result?.token_accounts) {
      return response.data.result.total ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

// Estimate holder score from transaction count (fallback when no API key)
export function estimateHolderScore(
  buys24h: number,
  sells24h: number,
  holderCount: number | null
): number {
  if (holderCount !== null) {
    if (holderCount > 500) return 25;
    if (holderCount > 100) return 18;
    if (holderCount > 50) return 12;
    if (holderCount > 10) return 6;
    return 2;
  }

  // Estimate from tx activity: more unique buyers = better distribution
  const totalTxns = buys24h + sells24h;
  if (totalTxns > 200) return 20;
  if (totalTxns > 100) return 15;
  if (totalTxns > 50) return 10;
  if (totalTxns > 20) return 5;
  return 2;
}
