import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("wallet");

  // Single wallet portfolio view
  if (walletAddress) {
    const wallet = await prisma.whaleWallet.findFirst({
      where: { address: walletAddress },
    }).catch(() => null);
    return Response.json({ wallet });
  }

  // Top 20 whale wallets by total volume
  const wallets = await prisma.whaleWallet.findMany({
    orderBy: { totalVolume: "desc" },
    take: 20,
  }).catch(() => []);

  return Response.json({ wallets });
}
