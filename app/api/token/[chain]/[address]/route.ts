import { prisma } from "@/lib/prisma";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";
import { scoreToken } from "@/lib/scoring/scorer";

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
  priceChange: { h1: number; h6: number; h24: number; d7?: number };
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

function normChain(chain: string): { dexId: string; geckoId: string } {
  const cfg = CHAIN_CONFIG[normalizeChain(chain) ?? "BASE"];
  return { dexId: cfg.dexId, geckoId: cfg.geckoId ?? cfg.dexId };
}

async function fetchDexScreener(address: string, chain: string): Promise<DexScreenerTokenResponse> {
  const { dexId } = normChain(chain);
  const res = await fetch(
    `https://api.dexscreener.com/tokens/v1/${dexId}/${address}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { schemaVersion: "1", pairs: null };
  const data = await res.json();
  // v1 returns array directly
  if (Array.isArray(data)) return { schemaVersion: "1", pairs: data };
  return data as DexScreenerTokenResponse;
}

async function fetchGeckoTerminalPools(address: string, chain: string) {
  const { geckoId } = normChain(chain);
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${geckoId}/tokens/${address}/pools?page=1`,
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
  const { geckoId } = normChain(chain);
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${geckoId}/tokens/${address}/info`,
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

async function fetchOHLCV(poolAddress: string, chain: string, timeframe: string, limitOverride?: number) {
  const { geckoId: network } = normChain(chain);
  let resolution: string, aggregate: number, defaultLimit: number;
  switch (timeframe) {
    case "1h": resolution = "hour"; aggregate = 1; defaultLimit = 200; break;
    case "4h": resolution = "hour"; aggregate = 4; defaultLimit = 200; break;
    case "1w": resolution = "day";  aggregate = 7; defaultLimit = 52;  break;
    default:   resolution = "day";  aggregate = 1; defaultLimit = 200; break;
  }
  const limit = limitOverride ?? defaultLimit;
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

  const chainUpper = (normalizeChain(chain) ?? chain.toUpperCase()) as string;

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

  // OHLCV from GeckoTerminal — main candles + separate 1h fetch for 24h H/L
  const pairAddr = topPair?.pairAddress ?? null;
  const [ohlcv, hourlyOhlcv] = await Promise.all([
    pairAddr ? fetchOHLCV(pairAddr, chain, timeframe) : Promise.resolve(null),
    pairAddr && timeframe !== "1h" ? fetchOHLCV(pairAddr, chain, "1h", 24) : Promise.resolve(null),
  ]);

  // Compute 24h High/Low
  const h1Candles = timeframe === "1h" ? (ohlcv?.slice(-24) ?? null) : hourlyOhlcv;
  const high24h = h1Candles?.length ? Math.max(...h1Candles.map((c) => c[2])) : null;
  const low24h  = h1Candles?.length ? Math.min(...h1Candles.map((c) => c[3])) : null;

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
  const discord = info?.socials?.find((s) => s.type === "discord")?.url
    ?? (geckoAttrs?.discord_url ?? null);

  // Similar tokens from DB (same chain, similar market cap ±10×)
  const mcap = topPair?.marketCap ?? null;
  const similarTokens = mcap && mcap > 0
    ? await prisma.token.findMany({
        where: {
          chain: chain.toUpperCase(),
          address: { not: address },
          marketCap: { gte: mcap * 0.1, lte: mcap * 10 },
          totalScore: { gt: 0 },
        },
        orderBy: { totalScore: "desc" },
        take: 5,
        select: {
          address: true, name: true, symbol: true,
          priceUsd: true, marketCap: true, totalScore: true,
          priceChange24h: true, chain: true,
        },
      })
    : [];

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
    discord,
    description,
    similarTokens,
    pairCreatedAt: topPair?.pairCreatedAt ?? null,
    listedAt: dbToken?.listedAt?.toISOString() ?? null,
    ohlcv,
    high24h,
    low24h,
    score: dbToken ? (() => {
      // Recompute Anti-Rug 2.0 sub-scores from live pair data + stored flags
      const liveScore = scoreToken({
        address,
        chain: (normalizeChain(chain) ?? "BASE"),
        name: topPair?.baseToken?.name ?? "Unknown",
        symbol: topPair?.baseToken?.symbol ?? "???",
        liquidity: topPair?.liquidity?.usd,
        volume24h: topPair?.volume?.h24,
        marketCap: topPair?.marketCap,
        priceUsd: topPair?.priceUsd ? parseFloat(topPair.priceUsd) : undefined,
        priceChange24h: topPair?.priceChange?.h24,
        buys24h: topPair?.txns?.h24?.buys,
        sells24h: topPair?.txns?.h24?.sells,
      });
      return {
        total: dbToken.totalScore,
        liquidity: dbToken.liquidityScore,
        holder: dbToken.holderScore,
        age: dbToken.ageScore,
        volume: dbToken.volumeScore,
        suspicion: dbToken.suspicionScore,
        contractSafety: liveScore.contractSafety,
        liquiditySafety: liveScore.liquiditySafety,
        teamSafety: liveScore.teamSafety,
        riskLevel: liveScore.riskLevel,
        insiderBuyCount: liveScore.insiderBuyCount,
        flags: liveScore.flags,
        isHoneypot: dbToken.isHoneypot,
        hasBundledBuys: dbToken.hasBundledBuys,
      };
    })() : null,
  });
}
