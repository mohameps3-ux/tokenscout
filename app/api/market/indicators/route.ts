export const dynamic = "force-dynamic";

const GCK = "https://api.coingecko.com/api/v3";

async function safeFetch<T>(url: string, ttl = 3600): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: ttl },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function sma(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function computeRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;
  const recent = prices.slice(-(period + 1));
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

interface CoinMarket {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_7d_in_currency: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number;
}

export async function GET() {
  const [btcChart, top100] = await Promise.all([
    safeFetch<{ prices: [number, number][] }>(
      `${GCK}/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily`,
      3600
    ),
    safeFetch<CoinMarket[]>(
      `${GCK}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=7d`,
      3600
    ),
  ]);

  const prices = (btcChart?.prices ?? []).map(([, p]) => p);
  const currentBtcPrice = prices[prices.length - 1] ?? null;

  // ── Puell Multiple (simplified: BTC price / 365-day MA)
  const ma365 = sma(prices, 365);
  const puellMultiple = currentBtcPrice && ma365 ? currentBtcPrice / ma365 : null;

  // ── Pi Cycle Top (111-day MA vs 2× 350-day MA)
  const ma111 = sma(prices, 111);
  const ma350 = sma(prices, 350);
  const piCycleRatio = ma111 && ma350 ? ma111 / (2 * ma350) : null;

  // ── BTC RSI (14-day)
  const btcRsi = computeRSI(prices, 14);

  // ── Altcoin Season Index
  // % of top 50 coins (excl. BTC) outperforming BTC over 7d
  let altcoinSeasonIndex: number | null = null;
  if (top100 && top100.length > 1) {
    const btcRow = top100.find((c) => c.id === "bitcoin");
    const btc7d = btcRow?.price_change_percentage_7d_in_currency ?? 0;
    const altcoins = top100.filter((c) => c.id !== "bitcoin" && c.id !== "tether" && c.id !== "usd-coin").slice(0, 50);
    const outperforming = altcoins.filter(
      (c) => (c.price_change_percentage_7d_in_currency ?? -999) > btc7d
    ).length;
    altcoinSeasonIndex = altcoins.length > 0 ? Math.round((outperforming / altcoins.length) * 100) : null;
  }

  // ── Average RSI of top 10 coins
  // We only have price histories for BTC here; use BTC RSI as a proxy and label accordingly
  const avgRsi = btcRsi;

  // ── Top 200 30-day performance distribution (approximate with 7d data from top 100)
  const performanceBuckets = { strongLoss: 0, loss: 0, flat: 0, gain: 0, strongGain: 0 };
  if (top100) {
    for (const c of top100) {
      const ch = c.price_change_percentage_7d_in_currency ?? 0;
      if (ch < -20) performanceBuckets.strongLoss++;
      else if (ch < -5) performanceBuckets.loss++;
      else if (ch <= 5) performanceBuckets.flat++;
      else if (ch <= 20) performanceBuckets.gain++;
      else performanceBuckets.strongGain++;
    }
  }

  // ── ETF Tracker (BTC spot ETF status — static info + BTC 30d performance as proxy)
  const btcChange30d = prices.length >= 30
    ? ((currentBtcPrice! - prices[prices.length - 30]) / prices[prices.length - 30]) * 100
    : null;

  return Response.json({
    puellMultiple: puellMultiple ? Math.round(puellMultiple * 100) / 100 : null,
    piCycle: {
      ma111: ma111 ? Math.round(ma111) : null,
      ma350x2: ma350 ? Math.round(ma350 * 2) : null,
      ratio: piCycleRatio ? Math.round(piCycleRatio * 1000) / 1000 : null,
      currentPrice: currentBtcPrice ? Math.round(currentBtcPrice) : null,
    },
    btcRsi: avgRsi ? Math.round(avgRsi) : null,
    altcoinSeasonIndex,
    performanceBuckets,
    btcChange30d: btcChange30d ? Math.round(btcChange30d * 10) / 10 : null,
    // ETF status: BTC spot ETFs launched Jan 2024; proxy with 30d BTC performance
    etfStatus: {
      launched: true,
      launchDate: "January 10, 2024",
      btcChange30d: btcChange30d ? Math.round(btcChange30d * 10) / 10 : null,
    },
  });
}
