export const dynamic = "force-dynamic";

interface BoostEntry {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
  header?: string;
  description?: string;
  links?: { label?: string; type?: string; url: string }[];
}

// GET /api/market/dex-trending — hot tokens from DexScreener boost data
export async function GET() {
  try {
    const res = await fetch("https://api.dexscreener.com/token-boosts/top/v1", {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 }, // 5 minute cache
    });
    if (!res.ok) return Response.json({ tokens: [] });

    const data = await res.json() as BoostEntry[];
    const tokens = (Array.isArray(data) ? data : []).slice(0, 12).map((t) => ({
      url: t.url,
      chainId: t.chainId,
      tokenAddress: t.tokenAddress,
      totalAmount: t.totalAmount,
      icon: t.icon ?? null,
      description: t.description ?? null,
    }));

    return Response.json({ tokens });
  } catch {
    return Response.json({ tokens: [] });
  }
}
