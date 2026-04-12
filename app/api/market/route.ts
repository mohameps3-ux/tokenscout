export const dynamic = "force-dynamic";

const GCK = "https://api.coingecko.com/api/v3";
const FNG = "https://api.alternative.me/fng/?limit=1";
// CoinGecko free tier: 250 coins max per request; fetch 2 pages for 500 total
const COINS_PER_PAGE = 250;
const MARKET_PARAMS = "vs_currency=usd&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d";

async function safeFetch<T>(url: string, ttl = 30): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: ttl },
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export async function GET() {
  const [page1, page2, global_, trending, fng] = await Promise.all([
    safeFetch<object[]>(
      `${GCK}/coins/markets?${MARKET_PARAMS}&per_page=${COINS_PER_PAGE}&page=1`,
      60
    ),
    safeFetch<object[]>(
      `${GCK}/coins/markets?${MARKET_PARAMS}&per_page=${COINS_PER_PAGE}&page=2`,
      60
    ),
    safeFetch<{ data: Record<string, unknown> }>(`${GCK}/global`, 60),
    safeFetch<{ coins: object[] }>(`${GCK}/search/trending`, 300),
    safeFetch<{ data: { value: string; value_classification: string }[] }>(FNG, 3600),
  ]);

  // Combine pages, deduplicate by id just in case
  const combined = [...(page1 ?? []), ...(page2 ?? [])];
  const seen = new Set<string>();
  const coins = combined.filter((c) => {
    const id = (c as { id?: string }).id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return Response.json({
    coins,
    global: global_?.data ?? null,
    trending: (trending?.coins ?? []).slice(0, 7),
    fearGreed: fng?.data?.[0] ?? null,
  });
}
