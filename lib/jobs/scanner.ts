import { prisma } from "@/lib/prisma";
import { fetchNewPools, fetchTrendingPools, parseGeckoPool } from "@/lib/api/geckoterminal";
import { searchNewPairs } from "@/lib/api/dexscreener";
import { scoreToken, TokenData } from "@/lib/scoring/scorer";
import { broadcastHighScoreAlerts, isTelegramConfigured } from "@/lib/telegram";
import type { Chain } from "@/lib/chains";

export async function scanChain(chain: Chain): Promise<{ added: number; updated: number }> {
  const start = Date.now();
  let added = 0;
  let updated = 0;

  try {
    console.log(`[Scanner] Starting scan for ${chain}`);

    // Fetch from GeckoTerminal (new + trending)
    const [newPoolsData, trendingPoolsData] = await Promise.all([
      fetchNewPools(chain),
      fetchTrendingPools(chain),
    ]);

    const allPools = [
      ...newPoolsData.data,
      ...trendingPoolsData.data,
    ];
    const allIncluded = [
      ...(newPoolsData.included ?? []),
      ...(trendingPoolsData.included ?? []),
    ];

    // Deduplicate by pool address
    const seenAddresses = new Set<string>();
    const uniquePools = allPools.filter((pool) => {
      if (seenAddresses.has(pool.attributes.address)) return false;
      seenAddresses.add(pool.attributes.address);
      return true;
    });

    // Also try DexScreener for additional coverage
    const dexPairs = await searchNewPairs(chain);

    // Process GeckoTerminal pools
    for (const pool of uniquePools) {
      try {
        const parsed = parseGeckoPool(pool, allIncluded);
        if (!parsed.address || parsed.address.length < 10) continue;

        const tokenData: TokenData = {
          address: parsed.address,
          chain,
          name: parsed.name,
          symbol: parsed.symbol,
          pairAddress: parsed.pairAddress,
          dexId: "gecko",
          priceUsd: parsed.priceUsd,
          liquidity: parsed.liquidity,
          marketCap: parsed.marketCap ?? undefined,
          volume24h: parsed.volume24h,
          priceChange24h: parsed.priceChange24h,
          listedAt: parsed.poolCreatedAt,
          buys24h: parsed.buys24h,
          sells24h: parsed.sells24h,
        };

        const scores = scoreToken(tokenData);

        const result = await upsertToken(tokenData, scores);
        if (result === "created") added++;
        else updated++;
      } catch (err) {
        console.error(`[Scanner] Error processing pool ${pool.id}:`, err);
      }
    }

    // Process DexScreener pairs
    for (const pair of dexPairs.slice(0, 50)) {
      try {
        if (!pair.baseToken?.address) continue;

        const tokenData: TokenData = {
          address: pair.baseToken.address,
          chain,
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          pairAddress: pair.pairAddress,
          dexId: pair.dexId,
          priceUsd: pair.priceUsd ? parseFloat(pair.priceUsd) : undefined,
          liquidity: pair.liquidity?.usd,
          marketCap: pair.marketCap ?? pair.fdv,
          volume24h: pair.volume?.h24,
          priceChange24h: pair.priceChange?.h24,
          listedAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt) : undefined,
          buys24h: pair.txns?.h24?.buys,
          sells24h: pair.txns?.h24?.sells,
          buys1h: pair.txns?.h1?.buys,
          sells1h: pair.txns?.h1?.sells,
        };

        const scores = scoreToken(tokenData);
        const result = await upsertToken(tokenData, scores);
        if (result === "created") added++;
        else if (result === "updated") updated++;
      } catch (err) {
        console.error(`[Scanner] Error processing pair ${pair.pairAddress}:`, err);
      }
    }

    const duration = Date.now() - start;
    console.log(`[Scanner] ${chain} complete: +${added} new, ~${updated} updated (${duration}ms)`);

    await prisma.jobLog.create({
      data: {
        jobName: `scan-${chain.toLowerCase()}`,
        status: "success",
        message: `Added ${added}, updated ${updated}`,
        duration,
      },
    });

    // Telegram: broadcast newly added tokens scoring > 80 to Pro alert channel
    if (added > 0 && isTelegramConfigured()) {
      const highScoreNew = await prisma.token.findMany({
        where: {
          chain,
          totalScore: { gte: 80 },
          createdAt: { gte: new Date(start) },
        },
        orderBy: { totalScore: "desc" },
        take: 5,
      });
      if (highScoreNew.length > 0) {
        broadcastHighScoreAlerts(highScoreNew).catch((e) =>
          console.error("[Scanner] Telegram broadcast failed:", e)
        );
      }
    }

    return { added, updated };
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Scanner] ${chain} failed:`, message);

    await prisma.jobLog.create({
      data: {
        jobName: `scan-${chain.toLowerCase()}`,
        status: "error",
        message,
        duration,
      },
    });

    return { added, updated };
  }
}

async function upsertToken(
  data: TokenData,
  scores: ReturnType<typeof scoreToken>
): Promise<"created" | "updated" | "skipped"> {
  const existingToken = await prisma.token.findUnique({
    where: { address_chain: { address: data.address, chain: data.chain } },
  });

  if (existingToken) {
    await prisma.token.update({
      where: { id: existingToken.id },
      data: {
        priceUsd: data.priceUsd,
        liquidity: data.liquidity,
        marketCap: data.marketCap,
        volume24h: data.volume24h,
        priceChange24h: data.priceChange24h,
        totalScore: scores.total,
        liquidityScore: scores.liquidity,
        holderScore: scores.holder,
        ageScore: scores.age,
        volumeScore: scores.volume,
        suspicionScore: scores.suspicion,
        isHoneypot: scores.isHoneypot,
        hasBundledBuys: scores.hasBundledBuys,
      },
    });

    await prisma.score.create({
      data: {
        tokenId: existingToken.id,
        totalScore: scores.total,
        liquidityScore: scores.liquidity,
        holderScore: scores.holder,
        ageScore: scores.age,
        volumeScore: scores.volume,
        suspicionScore: scores.suspicion,
        priceUsd: data.priceUsd,
        liquidity: data.liquidity,
        marketCap: data.marketCap,
        volume24h: data.volume24h,
      },
    });

    return "updated";
  } else {
    const token = await prisma.token.create({
      data: {
        address: data.address,
        chain: data.chain,
        name: data.name,
        symbol: data.symbol,
        pairAddress: data.pairAddress,
        dexId: data.dexId,
        priceUsd: data.priceUsd,
        liquidity: data.liquidity,
        marketCap: data.marketCap,
        volume24h: data.volume24h,
        priceChange24h: data.priceChange24h,
        totalScore: scores.total,
        liquidityScore: scores.liquidity,
        holderScore: scores.holder,
        ageScore: scores.age,
        volumeScore: scores.volume,
        suspicionScore: scores.suspicion,
        isHoneypot: scores.isHoneypot,
        hasBundledBuys: scores.hasBundledBuys,
        listedAt: data.listedAt,
      },
    });

    await prisma.score.create({
      data: {
        tokenId: token.id,
        totalScore: scores.total,
        liquidityScore: scores.liquidity,
        holderScore: scores.holder,
        ageScore: scores.age,
        volumeScore: scores.volume,
        suspicionScore: scores.suspicion,
        priceUsd: data.priceUsd,
        liquidity: data.liquidity,
        marketCap: data.marketCap,
        volume24h: data.volume24h,
      },
    });

    return "created";
  }
}
