import axios from "axios";
import { type Chain, CHAIN_CONFIG } from "@/lib/chains";

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

export async function fetchLatestTokens(chain: Chain): Promise<DexScreenerPair[]> {
  const dexId = CHAIN_CONFIG[chain].dexId;
  try {
    const response = await axios.get<DexScreenerResponse>(
      `${BASE_URL}/latest/dex/pairs/${dexId}`,
      { timeout: 10000 }
    );
    return response.data?.pairs ?? [];
  } catch (error) {
    console.error(`[DexScreener] Failed to fetch tokens for ${chain}:`, error);
    return [];
  }
}

export async function fetchTokenByAddress(
  address: string,
  chain: Chain
): Promise<DexScreenerPair | null> {
  const dexId = CHAIN_CONFIG[chain].dexId;
  try {
    const response = await axios.get<DexScreenerResponse>(
      `${BASE_URL}/latest/dex/tokens/${address}`,
      { timeout: 10000 }
    );
    const pairs = response.data?.pairs;
    if (!pairs || !Array.isArray(pairs)) return null;
    return pairs.find((p) => p.chainId === dexId) ?? pairs[0] ?? null;
  } catch (error) {
    console.error(`[DexScreener] Failed to fetch token ${address}:`, error);
    return null;
  }
}

export async function searchNewPairs(chain: Chain): Promise<DexScreenerPair[]> {
  const dexId = CHAIN_CONFIG[chain].dexId;
  try {
    const response = await axios.get(
      `${BASE_URL}/token-profiles/latest/v1`,
      { timeout: 10000 }
    );
    const data = Array.isArray(response.data) ? response.data : [];
    const filtered = data.filter((item: { chainId?: string }) => item.chainId === dexId);
    if (filtered.length === 0) return fetchLatestTokens(chain);

    const addresses = filtered.slice(0, 20).map((item: { tokenAddress: string }) => item.tokenAddress).join(",");
    const pairResponse = await axios.get<DexScreenerResponse>(
      `${BASE_URL}/latest/dex/tokens/${addresses}`,
      { timeout: 10000 }
    );
    return pairResponse.data?.pairs ?? [];
  } catch {
    return fetchLatestTokens(chain);
  }
}
