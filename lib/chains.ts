export const CHAINS = ["BASE", "SOLANA", "ETHEREUM", "POLYGON", "ARBITRUM", "AVALANCHE", "BSC", "FANTOM", "OPTIMISM", "ZKSYNC"] as const;
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
  BSC: {
    label: "BNB Chain",
    geckoId: "bsc",
    dexId: "bsc",
    explorerName: "BscScan",
    explorerUrl: (a) => `https://bscscan.com/token/${a}`,
    tradeLinks: (a) => [
      { label: "PancakeSwap", url: `https://pancakeswap.finance/swap?outputCurrency=${a}`, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
    ],
    color: "text-yellow-400",
  },
  FANTOM: {
    label: "Fantom",
    geckoId: "ftm",
    dexId: "fantom",
    explorerName: "FTMScan",
    explorerUrl: (a) => `https://ftmscan.com/token/${a}`,
    tradeLinks: (a) => [
      { label: "SpookySwap", url: `https://spooky.fi/#/swap?outputCurrency=${a}`, color: "text-blue-300 border-blue-300/30 bg-blue-300/10" },
    ],
    color: "text-blue-300",
  },
  OPTIMISM: {
    label: "Optimism",
    geckoId: "optimism",
    dexId: "optimism",
    explorerName: "Optimistic Etherscan",
    explorerUrl: (a) => `https://optimistic.etherscan.io/token/${a}`,
    tradeLinks: (a, pair) => [
      { label: "Uniswap", url: pair ? `https://app.uniswap.org/explore/pools/optimism/${pair}` : `https://app.uniswap.org/swap?outputCurrency=${a}&chain=optimism`, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
      { label: "Velodrome", url: `https://velodrome.finance/swap?to=${a}`, color: "text-red-300 border-red-300/30 bg-red-300/10" },
    ],
    color: "text-red-300",
  },
  ZKSYNC: {
    label: "zkSync",
    geckoId: "zksync",
    dexId: "zksync",
    explorerName: "zkSync Explorer",
    explorerUrl: (a) => `https://explorer.zksync.io/address/${a}`,
    tradeLinks: (a) => [
      { label: "SyncSwap", url: `https://syncswap.xyz/#/swap?to=${a}`, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    ],
    color: "text-cyan-400",
  },
};

/** Map a raw chain string (any case) to the canonical Chain key, or null if unknown */
export function normalizeChain(raw: string): Chain | null {
  const upper = raw.toUpperCase() as Chain;
  return CHAINS.includes(upper) ? upper : null;
}
