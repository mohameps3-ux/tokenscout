import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return Response.json({ results: [] });
  }

  // Exact address match first (ETH/SOL addresses are long hex/base58 strings)
  const isAddress = /^[a-zA-Z0-9]{32,}$/.test(q);

  const tokens = await prisma.token.findMany({
    where: isAddress
      ? { address: { equals: q } }
      : {
          OR: [
            { name:    { contains: q } },
            { symbol:  { contains: q } },
            { address: { startsWith: q } },
          ],
        },
    orderBy: { totalScore: "desc" },
    take: 8,
    select: {
      address: true,
      chain: true,
      name: true,
      symbol: true,
      priceUsd: true,
      totalScore: true,
      liquidity: true,
      isHoneypot: true,
    },
  });

  return Response.json({ results: tokens });
}
