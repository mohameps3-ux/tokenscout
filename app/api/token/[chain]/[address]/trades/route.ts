import { NextRequest } from "next/server";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chain: string; address: string }> }
) {
  const { chain } = await params;
  const pairAddress = request.nextUrl.searchParams.get("pair");

  const normalized = normalizeChain(chain.toUpperCase());
  const cfg = normalized ? CHAIN_CONFIG[normalized] : null;

  if (!cfg?.geckoId || !pairAddress) {
    return Response.json({ trades: [] });
  }

  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${cfg.geckoId}/pools/${pairAddress}/trades?limit=30`;
    const res = await fetch(url, {
      headers: { Accept: "application/json;version=20230302" },
      next: { revalidate: 30 },
    });

    if (!res.ok) return Response.json({ trades: [] });
    const json = await res.json();

    // GeckoTerminal response shape: { data: [ { id, attributes: { kind, price_to_in_usd, volume_in_usd, tx_from_address, block_timestamp } } ] }
    const trades = (json.data ?? []).map((t: {
      id: string;
      attributes: {
        kind?: string;
        price_to_in_usd?: string;
        volume_in_usd?: string;
        tx_from_address?: string;
        block_timestamp?: string;
      };
    }) => ({
      txHash: t.id,
      type: t.attributes.kind === "buy" ? "buy" : "sell",
      priceUsd: parseFloat(t.attributes.price_to_in_usd ?? "0"),
      amountUsd: parseFloat(t.attributes.volume_in_usd ?? "0"),
      walletAddress: t.attributes.tx_from_address ?? "",
      timestamp: t.attributes.block_timestamp ?? "",
    }));

    return Response.json({ trades });
  } catch {
    return Response.json({ trades: [] });
  }
}
