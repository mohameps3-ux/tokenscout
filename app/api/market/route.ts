export const dynamic = "force-dynamic";

const GCK = "https://api.coingecko.com/api/v3";
const FNG = "https://api.alternative.me/fng/?limit=1";

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
  const [coins, global_, trending, fng] = await Promise.all([
    safeFetch<object[]>(
      `${GCK}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h,7d`,
      30
    ),
    safeFetch<{ data: Record<string, unknown> }>(`${GCK}/global`, 60),
    safeFetch<{ coins: object[] }>(`${GCK}/search/trending`, 300),
    safeFetch<{ data: { value: string; value_classification: string }[] }>(FNG, 3600),
  ]);

  return Response.json({
    coins: coins ?? [],
    global: global_?.data ?? null,
    trending: (trending?.coins ?? []).slice(0, 7),
    fearGreed: fng?.data?.[0] ?? null,
  });
}
