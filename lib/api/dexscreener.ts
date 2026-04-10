import axios from "axios";

const BASE_URL = "https://api.dexscreener.com";

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd?: string;
  liquidity?: { usd?: number; base?: number; quote?: number };
  volume?: { h24?: number; h6?: number; h1?: number; m5?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number; m5?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  txns?: {
    h24?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    m5?: { buys: number; sells: number };
  };
}

export interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null;
}

const CHAIN_MAP: Record<string, string[]> = {
  BASE: ["base"],
  SOLANA: ["solana"],
};

export async function fetchLatestTokens(chain: "BASE" | "SOLANA"): Promise<DexScreenerPair[]> {
  try {
    const chainIds = CHAIN_MAP[chain];
    const results: DexScreenerPair[] = [];

    for (const chainId of chainIds) {
      // Fetch latest pairs for chain via token search
      const response = await axios.get<DexScreenerResponse>(
        `${BASE_URL}/latest/dex/pairs/${chainId}`,
        { timeout: 10000 }
      );

      const pairs = response.data?.pairs;
      if (pairs && Array.isArray(pairs)) {
        results.push(...pairs);
      }
    }

    return results;
  } catch (error) {
    console.error(`[DexScreener] Failed to fetch tokens for ${chain}:`, error);
    return [];
  }
}

export async function fetchTokenByAddress(
  address: string,
  chain: "BASE" | "SOLANA"
): Promise<DexScreenerPair | null> {
  try {
    const chainId = chain === "BASE" ? "base" : "solana";
    const response = await axios.get<DexScreenerResponse>(
      `${BASE_URL}/latest/dex/tokens/${address}`,
      { timeout: 10000 }
    );

    const pairs = response.data?.pairs;
    if (!pairs || !Array.isArray(pairs)) return null;

    return pairs.find((p) => p.chainId === chainId) ?? pairs[0] ?? null;
  } catch (error) {
    console.error(`[DexScreener] Failed to fetch token ${address}:`, error);
    return null;
  }
}

export async function searchNewPairs(chain: "BASE" | "SOLANA"): Promise<DexScreenerPair[]> {
  try {
    // Get recently created pairs by querying latest tokens
    const chainId = chain === "BASE" ? "base" : "solana";
    const response = await axios.get(
      `${BASE_URL}/token-profiles/latest/v1`,
      { timeout: 10000 }
    );

    // Filter by chain and return latest
    const data = Array.isArray(response.data) ? response.data : [];
    const filtered = data.filter((item: any) => item.chainId === chainId);

    if (filtered.length === 0) return [];

    // Fetch pair data for these tokens
    const addresses = filtered.slice(0, 20).map((item: any) => item.tokenAddress).join(",");
    const pairResponse = await axios.get<DexScreenerResponse>(
      `${BASE_URL}/latest/dex/tokens/${addresses}`,
      { timeout: 10000 }
    );

    return pairResponse.data?.pairs ?? [];
  } catch {
    // Fallback: fetch latest pairs directly
    return fetchLatestTokens(chain);
  }
}
