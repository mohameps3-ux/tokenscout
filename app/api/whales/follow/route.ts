import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/whales/follow — follow a whale wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, chain } = body as {
      userId: string;
      walletAddress: string;
      chain: string;
    };

    if (!userId || !walletAddress || !chain) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const follow = await prisma.whaleFollow.upsert({
      where: {
        userId_walletAddress_chain: { userId, walletAddress, chain },
      },
      update: {},
      create: { userId, walletAddress, chain },
    });

    return Response.json({ follow });
  } catch {
    return Response.json({ error: "Failed to follow" }, { status: 500 });
  }
}

// DELETE /api/whales/follow — unfollow a whale wallet
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, chain } = body as {
      userId: string;
      walletAddress: string;
      chain: string;
    };

    if (!userId || !walletAddress || !chain) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.whaleFollow.deleteMany({
      where: { userId, walletAddress, chain },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to unfollow" }, { status: 500 });
  }
}
