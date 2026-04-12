import { prisma } from "@/lib/prisma";
import { normalizeChain } from "@/lib/chains";
import { NextRequest } from "next/server";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const chain = searchParams.get("chain");
    const minScore = parseInt(searchParams.get("minScore") ?? "0") || 0;
    const minLiquidity = parseFloat(searchParams.get("minLiquidity") ?? "0") || 0;
    const age = searchParams.get("age");
    const sort = searchParams.get("sort") ?? "score";
    const page = parseInt(searchParams.get("page") ?? "1") || 1;

    // Build date filter
    let createdAfter: Date | undefined;
    if (age === "1h") createdAfter = new Date(Date.now() - 60 * 60 * 1000);
    else if (age === "24h") createdAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (age === "7d") createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const where = {
      ...(chain && chain !== "ALL" ? { chain: normalizeChain(chain) ?? chain } : {}),
      ...(minScore > 0 ? { totalScore: { gte: minScore } } : {}),
      ...(minLiquidity > 0 ? { liquidity: { gte: minLiquidity } } : {}),
      ...(createdAfter ? { createdAt: { gte: createdAfter } } : {}),
    };

    const orderBy = (() => {
      switch (sort) {
        case "liquidity": return { liquidity: "desc" as const };
        case "volume": return { volume24h: "desc" as const };
        case "age": return { createdAt: "desc" as const };
        case "change": return { priceChange24h: "desc" as const };
        default: return { totalScore: "desc" as const };
      }
    })();

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          address: true,
          chain: true,
          name: true,
          symbol: true,
          priceUsd: true,
          liquidity: true,
          marketCap: true,
          volume24h: true,
          priceChange24h: true,
          totalScore: true,
          liquidityScore: true,
          holderScore: true,
          ageScore: true,
          volumeScore: true,
          suspicionScore: true,
          isHoneypot: true,
          hasBundledBuys: true,
          listedAt: true,
          createdAt: true,
          pairAddress: true,
          dexId: true,
        },
      }),
      prisma.token.count({ where }),
    ]);

    return Response.json({
      tokens,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("[API /tokens] Error:", error);
    return Response.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}
