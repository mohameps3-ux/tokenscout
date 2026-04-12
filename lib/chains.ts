export const CHAINS = ["BASE", "SOLANA", "ETHEREUM", "POLYGON", "ARBITRUM", "AVALANCHE"] as const;
export type Chain = typeof CHAINS[number];

export interface ChainConfig {
  label: string;
  geckoId: string | null;   // GeckoTerminal network slug (null = not supported)
  dexId: string;            // DexScreener chainId
  explorerName: string;
  explorerUrl: (address: string) => string;
  tradeLinks: (address: string, pairAddress: string | null) => { label: string; url: string; color: string }[];
  color: string;            // Tailwind text color for badge
}

export const CHAIN_CONFIG: Record<Chain, ChainConfig> = {
  BASE: {
    label: "Base",
    geckoId: "base",
    dexId: "base",
    explorerName: "Basescan",
    explorerUrl: (a) => `https://basescan.org/token/${a}`,
    tradeLinks: (a, pair) => [
      { label: "Uniswap",   url: pair ? `https://app.uniswap.org/explore/pools/base/${pair}` : `https://app.uniswap.org/swap?outputCurrency=${a}&chain=base`, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
      { label: "Aerodrome", url: `https://aerodrome.finance/swap?from=eth&to=${a}`, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
    ],
    color: "text-blue-400",
  },
  SOLANA: {
    label: "Solana",
    geckoId: "solana",
    dexId: "solana",
    explorerName: "Solscan",
    explorerUrl: (a) => `https://solscan.io/token/${a}`,
    tradeLinks: (a) => [
      { label: "Jupiter",  url: `https://jup.ag/swap/SOL-${a}`,                color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
      { label: "Raydium",  url: `https://raydium.io/swap/?outputCurrency=${a}`, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
    ],
    color: "text-purple-400",
  },
  ETHEREUM: {
    label: "Ethereum",
    geckoId: "eth",
    dexId: "ethereum",
    explorerName: "Etherscan",
    explorerUrl: (a) => `https://etherscan.io/token/${a}`,
    tradeLinks: (a, pair) => [
      { label: "Uniswap",  url: pair ? `https://app.uniswap.org/explore/pools/ethereum/${pair}` : `https://app.uniswap.org/swap?outputCurrency=${a}&chain=mainnet`, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
    ],
    color: "text-indigo-400",
  },
  POLYGON: {
    label: "Polygon",
    geckoId: "polygon_pos",
    dexId: "polygon",
    explorerName: "Polygonscan",
    explorerUrl: (a) => `https://polygonscan.com/token/${a}`,
    tradeLinks: (a) => [
      { label: "QuickSwap", url: `https://quickswap.exchange/#/swap?outputCurrency=${a}`, color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
      { label: "Uniswap",   url: `https://app.uniswap.org/swap?outputCurrency=${a}&chain=polygon`, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
    ],
    color: "text-violet-400",
  },
  ARBITRUM: {
    label: "Arbitrum",
    geckoId: "arbitrum",
    dexId: "arbitrum",
    explorerName: "Arbiscan",
    explorerUrl: (a) => `https://arbiscan.io/token/${a}`,
    tradeLinks: (a, pair) => [
      { label: "Uniswap",   url: pair ? `https://app.uniswap.org/explore/pools/arbitrum/${pair}` : `https://app.uniswap.org/swap?outputCurrency=${a}&chain=arbitrum`, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
      { label: "Camelot",   url: `https://app.camelot.exchange/?token2=${a}`, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    ],
    color: "text-sky-400",
  },
  AVALANCHE: {
    label: "Avalanche",
    geckoId: "avax",
    dexId: "avalanche",
    explorerName: "Snowtrace",
    explorerUrl: (a) => `https://snowtrace.io/token/${a}`,
    tradeLinks: (a) => [
      { label: "Trader Joe", url: `https://traderjoexyz.com/avalanche/trade?outputCurrency=${a}`, color: "text-red-400 border-red-500/30 bg-red-500/10" },
    ],
    color: "text-red-400",
  },
};

/** Map a raw chain string (any case) to the canonical Chain key, or null if unknown */
export function normalizeChain(raw: string): Chain | null {
  const upper = raw.toUpperCase() as Chain;
  return CHAINS.includes(upper) ? upper : null;
}
