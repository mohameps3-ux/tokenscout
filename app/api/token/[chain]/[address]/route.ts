import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd?: string;
  txns: { h24: { buys: number; sells: number } };
  volume: { h24: number; h6: number; h1: number };
  priceChange: { h1: number; h6: number; h24: number };
  liquidity?: { usd: number; base: number; quote: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

interface DexScreenerTokenResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

interface GeckoTerminalPool {
  id: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    volume_usd: { h24: string };
    reserve_in_usd: string;
    pool_created_at: string;
  };
  relationships: {
    dex: { data: { id: string } };
  };
}

interface GeckoOHLCV {
  data: {
    attributes: {
      ohlcv_list: [number, number, number, number, number, number][];
    };
  };
}

function normChain(chain: string): string {
  return chain.toUpperCase() === "SOLANA" ? "solana" : "base";
}

async function fetchDexScreener(address: string, chain: string): Promise<DexScreenerTokenResponse> {
  const chainSlug = normChain(chain);
  const res = await fetch(
    `https://api.dexscreener.com/tokens/v1/${chainSlug}/${address}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { schemaVersion: "1", pairs: null };
  const data = await res.json();
  // v1 returns array directly
  if (Array.isArray(data)) return { schemaVersion: "1", pairs: data };
  return data as DexScreenerTokenResponse;
}

async function fetchGeckoTerminalPools(address: string, chain: string) {
  const network = normChain(chain);
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${address}/pools?page=1`,
      {
        headers: { "Accept": "application/json;version=20230302" },
        next: { revalidate: 120 },
      }
    );
    if (!res.ok) return null;
    return await res.json() as { data: GeckoTerminalPool[] };
  } catch {
    return null;
  }
}

async function fetchGeckoTerminalInfo(address: string, chain: string) {
  const network = normChain(chain);
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${address}/info`,
      {
        headers: { "Accept": "application/json;version=20230302" },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchOHLCV(poolAddress: string, chain: string, timeframe: string) {
  const network = normChain(chain);
  const resolution = timeframe === "1h" ? "hour" : timeframe === "4h" ? "hour" : "day";
  const limit = timeframe === "4h" ? 96 : 168;
  const aggregate = timeframe === "4h" ? 4 : 1;
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${resolution}?aggregate=${aggregate}&limit=${limit}&currency=usd`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json;version=20230302" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json() as GeckoOHLCV;
    return data.data?.attributes?.ohlcv_list ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chain: string; address: string }> }
) {
  const { chain, address } = await params;
  const url = new URL(_request.url);
  const timeframe = url.searchParams.get("timeframe") ?? "1h";

  const chainUpper = chain.toUpperCase() as "BASE" | "SOLANA";

  const [dexData, geckoInfo, dbToken] = await Promise.all([
    fetchDexScreener(address, chain),
    fetchGeckoTerminalInfo(address, chain),
    prisma.token.findUnique({
      where: { address_chain: { address, chain: chainUpper } },
      select: {
        totalScore: true, liquidityScore: true, holderScore: true,
        ageScore: true, volumeScore: true, suspicionScore: true,
        isHoneypot: true, hasBundledBuys: true, listedAt: true,
      },
    }).catch(() => null),
  ]);

  const pairs = dexData.pairs ?? [];
  const topPair = pairs[0] ?? null;

  // Pools from DexScreener
  const pools = pairs.map((p) => ({
    dex: p.dexId,
    pairAddress: p.pairAddress,
    quoteSymbol: p.quoteToken.symbol,
    liquidityUsd: p.liquidity?.usd ?? 0,
    volume24h: p.volume?.h24 ?? 0,
    url: p.url,
  }));

  // OHLCV from GeckoTerminal using top pair address
  let ohlcv: [number, number, number, number, number, number][] | null = null;
  if (topPair?.pairAddress) {
    ohlcv = await fetchOHLCV(topPair.pairAddress, chain, timeframe);
  }

  // Info from DexScreener
  const info = topPair?.info ?? null;
  const website = info?.websites?.[0]?.url ?? null;
  const twitter = info?.socials?.find((s) => s.type === "twitter")?.url ?? null;
  const telegram = info?.socials?.find((s) => s.type === "telegram")?.url ?? null;

  // Info from GeckoTerminal
  const geckoAttrs = geckoInfo?.data?.attributes ?? null;
  const description = geckoAttrs?.description ?? null;
  const imageUrl = geckoAttrs?.image_url ?? info?.imageUrl ?? null;
  const totalSupply = geckoAttrs?.total_supply ?? null;
  const gtWebsite = geckoAttrs?.websites?.[0] ?? null;
  const gtTwitter = geckoAttrs?.twitter_handle ? `https://twitter.com/${geckoAttrs.twitter_handle}` : null;
  const gtTelegram = geckoAttrs?.telegram_handle ? `https://t.me/${geckoAttrs.telegram_handle}` : null;

  return Response.json({
    address,
    chain: chain.toUpperCase(),
    name: topPair?.baseToken?.name ?? geckoAttrs?.name ?? null,
    symbol: topPair?.baseToken?.symbol ?? geckoAttrs?.symbol ?? null,
    imageUrl,
    priceUsd: topPair?.priceUsd ? parseFloat(topPair.priceUsd) : null,
    priceChange: topPair?.priceChange ?? null,
    marketCap: topPair?.marketCap ?? null,
    fdv: topPair?.fdv ?? null,
    totalSupply: totalSupply ? parseFloat(totalSupply) : null,
    volume24h: topPair?.volume?.h24 ?? null,
    txns24h: topPair?.txns?.h24 ?? null,
    liquidity: topPair?.liquidity?.usd ?? null,
    pairAddress: topPair?.pairAddress ?? null,
    pools,
    website: website ?? gtWebsite ?? null,
    twitter: twitter ?? gtTwitter ?? null,
    telegram: telegram ?? gtTelegram ?? null,
    description,
    pairCreatedAt: topPair?.pairCreatedAt ?? null,
    listedAt: dbToken?.listedAt?.toISOString() ?? null,
    ohlcv,
    score: dbToken ? {
      total: dbToken.totalScore,
      liquidity: dbToken.liquidityScore,
      holder: dbToken.holderScore,
      age: dbToken.ageScore,
      volume: dbToken.volumeScore,
      suspicion: dbToken.suspicionScore,
      isHoneypot: dbToken.isHoneypot,
      hasBundledBuys: dbToken.hasBundledBuys,
    } : null,
  });
}
