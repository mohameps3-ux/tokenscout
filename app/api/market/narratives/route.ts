export const dynamic = "force-dynamic";

const GCK = "https://api.coingecko.com/api/v3";

interface NarrativeCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

const NARRATIVES: NarrativeCategory[] = [
  { id: "artificial-intelligence", label: "AI Tokens", emoji: "🤖", color: "text-blue-400 border-blue-500/30 bg-blue-500/5", description: "AI & machine learning protocols" },
  { id: "decentralized-finance-defi", label: "DeFi", emoji: "🏦", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5", description: "Decentralized finance protocols" },
  { id: "gaming", label: "Gaming", emoji: "🎮", color: "text-purple-400 border-purple-500/30 bg-purple-500/5", description: "Blockchain gaming & metaverse" },
  { id: "real-world-assets-rwa", label: "RWA", emoji: "🏢", color: "text-amber-400 border-amber-500/30 bg-amber-500/5", description: "Real-world asset tokenization" },
  { id: "meme-token", label: "Memes", emoji: "🐸", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5", description: "Meme coins & community tokens" },
  { id: "layer-1", label: "Layer 1", emoji: "⛓️", color: "text-sky-400 border-sky-500/30 bg-sky-500/5", description: "Base-layer blockchain protocols" },
];

interface CoinRow {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number;
}

async function fetchCategory(categoryId: string): Promise<CoinRow[]> {
  try {
    const res = await fetch(
      `${GCK}/coins/markets?vs_currency=usd&category=${categoryId}&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=7d`,
      { next: { revalidate: 300 }, headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];
    return await res.json() as CoinRow[];
  } catch {
    return [];
  }
}

export async function GET() {
  // Fetch in parallel with a small stagger to avoid rate limiting
  const results = await Promise.all(
    NARRATIVES.map(async (cat, i) => {
      // Small delay stagger to avoid rate limiting on free tier
      if (i > 0) await new Promise((r) => setTimeout(r, i * 150));
      const coins = await fetchCategory(cat.id);
      return {
        ...cat,
        coins: coins.map((c) => ({
          id: c.id,
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          image: c.image,
          price: c.current_price,
          change24h: c.price_change_percentage_24h ?? null,
          change7d: c.price_change_percentage_7d_in_currency ?? null,
          marketCap: c.market_cap,
        })),
      };
    })
  );

  return Response.json({ narratives: results });
}
