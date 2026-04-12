// AI Confidence Score — heuristic-based 0-100 score
// Inputs: token fundamentals (liquidity, volume, age, buy/sell pressure)

export interface AiScoreInput {
  liquidity: number | null;
  volume24h: number | null;
  pairCreatedAt: number | null; // Unix timestamp in ms
  buys24h?: number | null;
  sells24h?: number | null;
}

export interface AiScoreResult {
  score: number;     // 0-100
  label: string;    // "Very Low" | "Low" | "Moderate" | "High"
  color: string;    // Tailwind text class
  reasons: string[];
}

export function computeAiScore(input: AiScoreInput): AiScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // ── Liquidity (0-30 pts) ─────────────────────────────────────────────────
  const liq = input.liquidity ?? 0;
  if (liq >= 100_000)      { score += 30; reasons.push("Strong liquidity (≥$100K)"); }
  else if (liq >= 50_000)  { score += 22; reasons.push("Good liquidity ($50K–$100K)"); }
  else if (liq >= 10_000)  { score += 14; reasons.push("Moderate liquidity ($10K–$50K)"); }
  else if (liq >= 1_000)   { score += 6;  reasons.push("Low liquidity ($1K–$10K)"); }
  else                     { reasons.push("Very low liquidity (<$1K)"); }

  // ── Volume / Liquidity ratio (0-25 pts) ──────────────────────────────────
  const vol = input.volume24h ?? 0;
  const ratio = liq > 0 ? vol / liq : 0;
  if (ratio >= 0.3 && ratio <= 5)    { score += 25; reasons.push("Healthy volume/liquidity ratio"); }
  else if (ratio > 5 && ratio <= 20) { score += 15; reasons.push("High trading activity"); }
  else if (ratio > 0.1 && ratio < 0.3) { score += 10; reasons.push("Low but existing volume"); }
  else if (ratio > 20)               { score += 5;  reasons.push("Unusually high volume (possible wash trading)"); }
  else                               { reasons.push("Minimal trading volume"); }

  // ── Token age (0-25 pts) ─────────────────────────────────────────────────
  const now = Date.now();
  const ageMs = input.pairCreatedAt ? now - input.pairCreatedAt : 0;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays >= 90)      { score += 25; reasons.push("Established token (≥90 days)"); }
  else if (ageDays >= 30) { score += 18; reasons.push("Seasoned token (30–90 days)"); }
  else if (ageDays >= 7)  { score += 12; reasons.push("Token is 7–30 days old"); }
  else if (ageDays >= 1)  { score += 6;  reasons.push("New token (<7 days)"); }
  else                    { reasons.push("Very new token (<24h)"); }

  // ── Buy/sell pressure (0-20 pts) ─────────────────────────────────────────
  const buys = input.buys24h ?? 0;
  const sells = input.sells24h ?? 0;
  const total = buys + sells;
  if (total > 0) {
    const buyPct = buys / total;
    if (buyPct >= 0.45 && buyPct <= 0.65)      { score += 20; reasons.push("Balanced buy/sell activity"); }
    else if (buyPct >= 0.35 && buyPct < 0.45)  { score += 12; reasons.push("Slight sell pressure"); }
    else if (buyPct > 0.65 && buyPct <= 0.80)  { score += 12; reasons.push("Moderate buying pressure"); }
    else if (buyPct > 0.80)                    { score += 6;  reasons.push("Heavy buying — possible pump"); }
    else                                       { score += 6;  reasons.push("Heavy selling pressure"); }
  }

  const clamped = Math.min(100, Math.max(0, Math.round(score)));

  let label: string;
  let color: string;
  if (clamped >= 75)      { label = "High";     color = "text-emerald-400"; }
  else if (clamped >= 50) { label = "Moderate"; color = "text-yellow-400"; }
  else if (clamped >= 25) { label = "Low";      color = "text-orange-400"; }
  else                    { label = "Very Low"; color = "text-red-400"; }

  return { score: clamped, label, color, reasons };
}
