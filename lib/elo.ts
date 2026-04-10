// ELO system for TokenScout prediction game
// Confidence range: 50–100 (50 = coin flip, 100 = certain)

const BASE_K = 40; // max ELO change per prediction

/**
 * Calculate ELO change for a prediction result.
 * - Correct high-confidence: big gain
 * - Wrong high-confidence: big loss
 * - Low confidence: small swing in either direction
 */
export function calcEloChange(confidence: number, correct: boolean): number {
  // Normalize confidence 50–100 → 0.0–1.0
  const normalizedConfidence = (confidence - 50) / 50;
  // K scales from BASE_K*0.25 (at 50%) to BASE_K (at 100%)
  const k = BASE_K * (0.25 + 0.75 * normalizedConfidence);

  // ELO expected score (treat "market" as equal-rated opponent)
  const expected = 0.5;
  const actual = correct ? 1 : 0;

  const change = Math.round(k * (actual - expected));
  return change; // positive = gain, negative = loss
}

/**
 * Apply ELO change and clamp to minimum floor (100).
 */
export function applyElo(currentElo: number, change: number): number {
  return Math.max(100, currentElo + change);
}

/**
 * Calculate accuracy percentage.
 */
export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100 * 10) / 10;
}

/**
 * Get ELO tier label and color.
 */
export function getEloTier(elo: number): {
  tier: string;
  color: string;
  icon: string;
} {
  if (elo >= 1500) return { tier: "Diamond", color: "text-cyan-400", icon: "💎" };
  if (elo >= 1300) return { tier: "Platinum", color: "text-violet-400", icon: "🔮" };
  if (elo >= 1150) return { tier: "Gold", color: "text-yellow-400", icon: "🥇" };
  if (elo >= 1050) return { tier: "Silver", color: "text-zinc-300", icon: "🥈" };
  return { tier: "Bronze", color: "text-amber-600", icon: "🥉" };
}

/**
 * Returns the start of the current ISO week (Monday 00:00:00 UTC).
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // adjust to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}
