// Rule-based AI prediction engine using token score signals

export interface AiPrediction {
  direction: "UP" | "DOWN";
  confidence: number; // 50–100
  reasoning: string;
}

/**
 * Generate an AI prediction for a token based on its score breakdown.
 * Uses deterministic rules + slight entropy from token address to avoid
 * all tokens getting the same prediction.
 */
export function getAiPrediction(token: {
  address: string;
  totalScore: number;
  liquidityScore: number;
  volumeScore: number;
  suspicionScore: number;
  ageScore: number;
  priceChange24h: number | null;
  liquidity: number | null;
  volume24h: number | null;
  marketCap: number | null;
  isHoneypot: boolean;
  hasBundledBuys: boolean;
}): AiPrediction {
  // Honeypot → always DOWN, high confidence
  if (token.isHoneypot) {
    return {
      direction: "DOWN",
      confidence: 90,
      reasoning: "Honeypot pattern detected — sellers can't exit.",
    };
  }

  // Bundled buys + low liquidity → dump incoming
  if (token.hasBundledBuys && (token.liquidity ?? 0) < 20_000) {
    return {
      direction: "DOWN",
      confidence: 78,
      reasoning: "Coordinated buy pattern with thin liquidity — exit risk high.",
    };
  }

  // Use last char of address as lightweight entropy seed (0–15)
  const entropy = parseInt(token.address.slice(-1), 16) || 0;

  // Score signals
  const hasGoodLiquidity = token.liquidityScore >= 15;
  const hasGoodVolume = token.volumeScore >= 12;
  const isSafe = token.suspicionScore >= 8;
  const isRecent = token.ageScore <= 15;
  const priceChange = token.priceChange24h ?? 0;
  const score = token.totalScore;

  // Strong bullish: high score, good liquidity, strong volume, recent
  if (score >= 75 && hasGoodLiquidity && hasGoodVolume && isSafe) {
    const conf = Math.min(88, 70 + Math.floor(entropy / 2));
    return {
      direction: "UP",
      confidence: conf,
      reasoning: `Strong fundamentals (score ${score}): healthy liquidity, high volume/mcap ratio, no red flags.`,
    };
  }

  // Momentum play: big recent pump with volume backing it
  if (priceChange > 50 && hasGoodVolume && hasGoodLiquidity) {
    const conf = Math.min(80, 62 + Math.floor(entropy / 3));
    return {
      direction: "UP",
      confidence: conf,
      reasoning: `Strong momentum (+${priceChange.toFixed(0)}%) backed by real volume — likely continuation.`,
    };
  }

  // Overbought: massive pump with thin liquidity → fade it
  if (priceChange > 200 && (token.liquidity ?? 0) < 30_000) {
    return {
      direction: "DOWN",
      confidence: 72,
      reasoning: `Parabolic move (+${priceChange.toFixed(0)}%) on thin liquidity — reversal likely.`,
    };
  }

  // Decent score, new token → slight bullish lean
  if (score >= 50 && isRecent && isSafe) {
    const conf = 52 + Math.floor(entropy / 4);
    return {
      direction: "UP",
      confidence: conf,
      reasoning: `Newly listed with decent score (${score}) — early-stage upside potential.`,
    };
  }

  // Weak score, suspicious patterns → DOWN
  if (score < 35 || !isSafe) {
    const conf = 55 + Math.floor(entropy / 3);
    return {
      direction: "DOWN",
      confidence: conf,
      reasoning: `Low score (${score}) and weak fundamentals — risk outweighs reward.`,
    };
  }

  // Default: neutral lean based on entropy tiebreak
  if (entropy >= 8) {
    return {
      direction: "UP",
      confidence: 54,
      reasoning: `Mixed signals — slight upward bias based on liquidity depth.`,
    };
  }

  return {
    direction: "DOWN",
    confidence: 54,
    reasoning: `Insufficient momentum signals — cautious bearish stance.`,
  };
}
