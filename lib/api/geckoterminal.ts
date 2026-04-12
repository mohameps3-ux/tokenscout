import axios from "axios";
import { type Chain, CHAIN_CONFIG } from "@/lib/chains";

const BASE_URL = "https://api.geckoterminal.com/api/v2";

export interface GeckoPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_native_currency: string;
    pool_created_at: string;
    reserve_in_usd: string;
    fdv_usd: string | null;
    market_cap_usd: string | null;
    volume_usd: {
      h24: string;
      h6: string;
      h1: string;
      m5: string;
    };
    transactions: {
      h24: { buys: number; sells: number; buyers: number; sellers: number };
      h6: { buys: number; sells: number; buyers: number; sellers: number };
      h1: { buys: number; sells: number; buyers: number; sellers: number };
      m5: { buys: number; sells: number; buyers: number; sellers: number };
    };
    price_change_percentage: {
      h24: string;
      h6: string;
      h1: string;
      m5: string;
    };
    token_price_usd?: string;
  };
  relationships?: {
    base_token?: { data: { id: string; type: string } };
    quote_token?: { data: { id: string; type: string } };
  };
}

export interface GeckoToken {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    image_url?: string;
    coingecko_coin_id?: string;
    decimals?: number;
  };
}

export interface GeckoNewPoolsResponse {
  data: GeckoPool[];
  included?: GeckoToken[];
}

export async function fetchNewPools(chain: Chain): Promise<GeckoNewPoolsResponse> {
  const geckoId = CHAIN_CONFIG[chain].geckoId;
  if (!geckoId) return { data: [] };
  try {
    const response = await axios.get<GeckoNewPoolsResponse>(
      `${BASE_URL}/networks/${geckoId}/new_pools`,
      {
        params: { include: "base_token,quote_token", page: 1 },
        headers: { Accept: "application/json;version=20230302" },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`[GeckoTerminal] Failed to fetch new pools for ${chain}:`, error);
    return { data: [] };
  }
}

export async function fetchTrendingPools(chain: Chain): Promise<GeckoNewPoolsResponse> {
  const geckoId = CHAIN_CONFIG[chain].geckoId;
  if (!geckoId) return { data: [] };
  try {
    const response = await axios.get<GeckoNewPoolsResponse>(
      `${BASE_URL}/networks/${geckoId}/trending_pools`,
      {
        params: { include: "base_token,quote_token" },
        headers: { Accept: "application/json;version=20230302" },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`[GeckoTerminal] Failed to fetch trending pools for ${chain}:`, error);
    return { data: [] };
  }
}

export function parseGeckoPool(
  pool: GeckoPool,
  includedTokens: GeckoToken[] = []
): {
  address: string;
  name: string;
  symbol: string;
  priceUsd: number;
  liquidity: number;
  marketCap: number | null;
  volume24h: number;
  priceChange24h: number;
  pairAddress: string;
  poolCreatedAt: Date;
  buys24h: number;
  sells24h: number;
} {
  const baseTokenId = pool.relationships?.base_token?.data?.id;
  const baseToken = includedTokens.find((t) => t.id === baseTokenId);

  return {
    address: baseToken?.attributes?.address ?? pool.id.split("_")[1] ?? "",
    name: baseToken?.attributes?.name ?? pool.attributes.name.split(" / ")[0],
    symbol: baseToken?.attributes?.symbol ?? "???",
    priceUsd: parseFloat(pool.attributes.base_token_price_usd) || 0,
    liquidity: parseFloat(pool.attributes.reserve_in_usd) || 0,
    marketCap: pool.attributes.market_cap_usd
      ? parseFloat(pool.attributes.market_cap_usd)
      : null,
    volume24h: parseFloat(pool.attributes.volume_usd.h24) || 0,
    priceChange24h:
      parseFloat(pool.attributes.price_change_percentage.h24) || 0,
    pairAddress: pool.attributes.address,
    poolCreatedAt: new Date(pool.attributes.pool_created_at),
    buys24h: pool.attributes.transactions.h24.buys,
    sells24h: pool.attributes.transactions.h24.sells,
  };
}
