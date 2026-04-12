import { estimateHolderScore } from "@/lib/api/holders";
import type { Chain } from "@/lib/chains";

export interface TokenData {
  address: string;
  chain: Chain;
  name: string;
  symbol: string;
  pairAddress?: string;
  dexId?: string;
  priceUsd?: number;
  liquidity?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  holderCount?: number;
  listedAt?: Date;
  buys24h?: number;
  sells24h?: number;
  buys1h?: number;
  sells1h?: number;
}

export type RiskLevel = "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "DANGER";

export interface ScoreBreakdown {
  total: number;
  liquidity: number;       // 0-25
  holder: number;          // 0-25
  age: number;             // 0-20
  volume: number;          // 0-20
  suspicion: number;       // 0-10 (10 = clean, 0 = suspicious)
  contractSafety: number;  // 0-100 (Anti-Rug 2.0)
  liquiditySafety: number; // 0-100
  teamSafety: number;      // 0-100
  riskLevel: RiskLevel;
  insiderBuyCount: number; // estimated suspicious early wallets
  flags: string[];
  isHoneypot: boolean;
  hasBundledBuys: boolean;
}

// ─── Liquidity Score (0-25) ───────────────────────────────────────────────────
function scoreLiquidity(liquidityUsd: number | undefined): number {
  if (!liquidityUsd) return 0;
  if (liquidityUsd >= 50_000) return 25;
  if (liquidityUsd >= 10_000) return 15;
  if (liquidityUsd >= 1_000) return 5;
  return 0;
}

// ─── Age Score (0-20) ─────────────────────────────────────────────────────────
function scoreAge(listedAt: Date | undefined): number {
  if (!listedAt) return 10; // Unknown - give middle score
  const ageMs = Date.now() - listedAt.getTime();
  const ageMinutes = ageMs / 60_000;

  if (ageMinutes < 60) return 5;          // <1h - very new, risky
  if (ageMinutes < 1440) return 15;       // 1h–24h - sweet spot
  return 20;                               // >24h - established
}

// ─── Volume/MCap Ratio Score (0-20) ──────────────────────────────────────────
function scoreVolumeMcap(volume24h: number | undefined, marketCap: number | undefined): number {
  if (!volume24h || !marketCap || marketCap === 0) return 0;
  const ratio = (volume24h / marketCap) * 100;
  if (ratio >= 10) return 20;
  if (ratio >= 5) return 12;
  if (ratio >= 1) return 5;
  return 0;
}

// ─── Suspicion Detection (0-10, 10=clean) ─────────────────────────────────────
function scoreSuspicion(data: TokenData): {
  score: number;
  flags: string[];
  isHoneypot: boolean;
  hasBundledBuys: boolean;
} {
  let score = 10;
  const flags: string[] = [];
  let isHoneypot = false;
  let hasBundledBuys = false;

  const buys = data.buys24h ?? 0;
  const sells = data.sells24h ?? 0;
  const totalTxns = buys + sells;

  // Honeypot pattern: many buys, almost no sells
  if (totalTxns > 10 && sells === 0) {
    score -= 8;
    flags.push("Zero sell transactions (possible honeypot)");
    isHoneypot = true;
  } else if (totalTxns > 20 && sells / (buys || 1) < 0.05) {
    score -= 5;
    flags.push("Extremely low sell ratio");
    isHoneypot = true;
  }

  // Bundled buys: many buys in first hour vs later
  const buys1h = data.buys1h ?? 0;
  if (buys1h > 0 && buys > 0 && buys1h / buys > 0.8 && buys > 20) {
    score -= 3;
    flags.push("Bundled buy activity detected in first hour");
    hasBundledBuys = true;
  }

  // Very low liquidity with high price change = manipulation risk
  const liq = data.liquidity ?? 0;
  const change = Math.abs(data.priceChange24h ?? 0);
  if (liq < 5000 && change > 500) {
    score -= 3;
    flags.push("High volatility with low liquidity");
  }

  // Extreme price change without volume
  if (change > 1000 && (data.volume24h ?? 0) < 1000) {
    score -= 2;
    flags.push("Extreme price move with minimal volume");
  }

  return {
    score: Math.max(0, score),
    flags,
    isHoneypot,
    hasBundledBuys,
  };
}

// ─── Anti-Rug 2.0 Sub-Scores ─────────────────────────────────────────────────

function scoreContractSafety(data: TokenData, suspicionResult: ReturnType<typeof scoreSuspicion>): number {
  if (suspicionResult.isHoneypot) return 5;
  const buys = data.buys24h ?? 0;
  const sells = data.sells24h ?? 0;
  const total = buys + sells;
  if (total > 10 && sells / (buys || 1) < 0.05) return 15;
  if (total > 5 && sells / (buys || 1) < 0.1) return 45;
  const change = Math.abs(data.priceChange24h ?? 0);
  if (change > 1000 && (data.liquidity ?? 0) < 5000) return 35;
  return 85;
}

function scoreLiquiditySafety(data: TokenData): number {
  const liq = data.liquidity ?? 0;
  if (liq >= 100_000) return 95;
  if (liq >= 50_000) return 82;
  if (liq >= 10_000) return 65;
  if (liq >= 1_000) return 38;
  return 12;
}

function scoreTeamSafety(data: TokenData, hasBundledBuys: boolean): { score: number; insiderBuyCount: number } {
  const buys1h = data.buys1h ?? 0;
  const buys24h = data.buys24h ?? 0;
  const earlyConcentration = buys24h > 0 ? buys1h / buys24h : 0;

  let score = 90;
  let insiderBuyCount = 0;

  if (hasBundledBuys) {
    score -= 45;
    insiderBuyCount = Math.max(3, Math.round(buys1h * 0.4));
  }

  if (earlyConcentration > 0.75 && buys1h > 10) {
    score -= 25;
    insiderBuyCount = Math.max(insiderBuyCount, Math.round(buys1h * 0.35));
    if (insiderBuyCount === 0) insiderBuyCount = Math.round(buys1h * 0.35);
  } else if (earlyConcentration > 0.6 && buys1h > 5) {
    score -= 12;
    insiderBuyCount = Math.max(insiderBuyCount, Math.round(buys1h * 0.2));
  }

  return { score: Math.max(5, score), insiderBuyCount };
}

function computeRiskLevel(total: number, isHoneypot: boolean, contractSafety: number): RiskLevel {
  if (isHoneypot || contractSafety <= 15) return "DANGER";
  if (total < 25 || contractSafety < 30) return "HIGH";
  if (total < 45) return "MEDIUM";
  if (total < 65) return "LOW";
  return "SAFE";
}

// ─── Main Scorer ──────────────────────────────────────────────────────────────
export function scoreToken(data: TokenData): ScoreBreakdown {
  const liquidityScore = scoreLiquidity(data.liquidity);
  const holderScore = estimateHolderScore(
    data.buys24h ?? 0,
    data.sells24h ?? 0,
    data.holderCount ?? null
  );
  const ageScore = scoreAge(data.listedAt);
  const volumeScore = scoreVolumeMcap(data.volume24h, data.marketCap);
  const suspicionResult = scoreSuspicion(data);
  const { score: suspicionScore, flags, isHoneypot, hasBundledBuys } = suspicionResult;

  const contractSafety  = scoreContractSafety(data, suspicionResult);
  const liquiditySafety = scoreLiquiditySafety(data);
  const { score: teamSafety, insiderBuyCount } = scoreTeamSafety(data, hasBundledBuys);
  const total = liquidityScore + holderScore + ageScore + volumeScore + suspicionScore;
  const riskLevel = computeRiskLevel(total, isHoneypot, contractSafety);

  return {
    total: Math.min(100, Math.max(0, total)),
    liquidity: liquidityScore,
    holder: holderScore,
    age: ageScore,
    volume: volumeScore,
    suspicion: suspicionScore,
    contractSafety,
    liquiditySafety,
    teamSafety,
    riskLevel,
    insiderBuyCount,
    flags,
    isHoneypot,
    hasBundledBuys,
  };
}

export function getScoreLabel(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score >= 75) return { label: "Strong", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
  if (score >= 50) return { label: "Decent", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" };
  if (score >= 25) return { label: "Weak", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" };
  return { label: "Risky", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };
}
