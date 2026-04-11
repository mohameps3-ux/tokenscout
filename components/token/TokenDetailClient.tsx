'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { PriceChart } from './PriceChart';

interface Pool {
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  url?: string;
}

interface TokenData {
  address: string;
  chain: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  priceUsd?: string;
  priceChange?: { h1?: number; h6?: number; h24?: number };
  marketCap?: number;
  fdv?: number;
  totalSupply?: string;
  volume24h?: number;
  txns24h?: { buys?: number; sells?: number };
  liquidity?: number;
  pools?: Pool[];
  website?: string;
  twitter?: string;
  telegram?: string;
  description?: string;
  ohlcv?: number[][];
}

interface Props {
  data: TokenData;
}

function fmt(n?: number | null, decimals = 2): string {
  if (n == null) return 'N/A';
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(decimals) + 'B';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(decimals) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(decimals) + 'K';
  return '$' + n.toFixed(decimals);
}

function PriceChangePill({ value }: { value?: number }) {
  if (value == null) return <span className="text-gray-500 text-sm">N/A</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${up ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-1 text-gray-400 hover:text-white transition-colors">
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

function explorerUrl(chain: string, address: string): string {
  if (chain === 'solana') return `https://solscan.io/token/${address}`;
  if (chain === 'base') return `https://basescan.org/token/${address}`;
  return '#';
}

export function TokenDetailClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'pools' | 'info'>('pools');

  const pools = data.pools || [];
  const isSolana = data.chain === 'solana';
  const isBase = data.chain === 'base';

  const tradeUrl = isSolana
    ? `https://jup.ag/swap/SOL-${data.address}`
    : `https://app.uniswap.org/#/swap?outputCurrency=${data.address}`;

  const aerodromUrl = isBase ? `https://aerodrome.finance/swap?to=${data.address}` : null;

  const explorerLink = explorerUrl(data.chain, data.address);
  const shortAddr = data.address.slice(0, 6) + '...' + data.address.slice(-4);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Token image + identity */}
          <div className="flex items-center gap-4 flex-1">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.symbol} className="w-14 h-14 rounded-full ring-2 ring-gray-700" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
                {data.symbol?.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{data.symbol}</h1>
                <span className="text-gray-400 text-lg">{data.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSolana ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
                  {data.chain.toUpperCase()}
                </span>
              </div>
              {/* Contract address */}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-gray-500 text-xs font-mono">{shortAddr}</span>
                <CopyButton text={data.address} />
                <a href={explorerLink} target="_blank" rel="noopener noreferrer" className="ml-1 text-gray-400 hover:text-blue-400 transition-colors">
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
          {/* Price */}
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {data.priceUsd ? '$' + parseFloat(data.priceUsd).toPrecision(5) : 'N/A'}
            </div>
            <div className="flex items-center justify-end gap-2 mt-1 flex-wrap">
              <span className="text-gray-500 text-xs">1h</span><PriceChangePill value={data.priceChange?.h1} />
              <span className="text-gray-500 text-xs">6h</span><PriceChangePill value={data.priceChange?.h6} />
              <span className="text-gray-500 text-xs">24h</span><PriceChangePill value={data.priceChange?.h24} />
            </div>
          </div>
        </div>

        {/* Trade buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <a href={tradeUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors">
            {isSolana ? '⚡ Trade on Jupiter' : '🦄 Trade on Uniswap'}
          </a>
          {aerodromUrl && (
            <a href={aerodromUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              🏎️ Trade on Aerodrome
            </a>
          )}
          <a href={explorerLink} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors flex items-center gap-1">
            Explorer <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { label: 'Market Cap', value: fmt(data.marketCap) },
          { label: 'FDV', value: fmt(data.fdv) },
          { label: 'Liquidity', value: fmt(data.liquidity) },
          { label: 'Volume 24h', value: fmt(data.volume24h) },
          { label: 'Buys 24h', value: data.txns24h?.buys?.toLocaleString() ?? 'N/A' },
          { label: 'Sells 24h', value: data.txns24h?.sells?.toLocaleString() ?? 'N/A' },
          { label: 'Total Supply', value: data.totalSupply ? parseFloat(data.totalSupply).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A' },
          { label: 'Pools', value: String(pools.length) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className="text-white font-semibold text-sm truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Price Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Price Chart</h2>
        </div>
        {data.ohlcv && data.ohlcv.length > 0 ? (
          <PriceChart ohlcv={data.ohlcv} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            No chart data available
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-800">
          <button onClick={() => setActiveTab('pools')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'pools' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}>
            Liquidity Pools ({pools.length})
          </button>
          <button onClick={() => setActiveTab('info')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}>
            Token Info
          </button>
        </div>

        {activeTab === 'pools' && (
          <div className="divide-y divide-gray-800">
            {pools.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm text-center">No pools found</p>
            ) : (
              pools.map((pool, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{pool.dexId.toUpperCase()}</span>
                      <span className="text-gray-400 text-sm">{pool.baseToken.symbol}/{pool.quoteToken.symbol}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-gray-600 text-xs font-mono">{pool.pairAddress.slice(0, 8)}...{pool.pairAddress.slice(-4)}</span>
                      <CopyButton text={pool.pairAddress} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{fmt(pool.liquidity?.usd)}</p>
                    <p className="text-gray-500 text-xs">Vol: {fmt(pool.volume?.h24)}</p>
                    {pool.url && (
                      <a href={pool.url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 justify-end mt-1">
                        Trade <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="p-6 space-y-4">
            {/* Social links */}
            <div className="flex gap-2 flex-wrap">
              {data.website && (
                <a href={data.website} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm flex items-center gap-1.5 transition-colors">
                  🌐 Website
                </a>
              )}
              {data.twitter && (
                <a href={data.twitter.startsWith('http') ? data.twitter : `https://twitter.com/${data.twitter}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm flex items-center gap-1.5 transition-colors">
                  𝕏 Twitter
                </a>
              )}
              {data.telegram && (
                <a href={data.telegram.startsWith('http') ? data.telegram : `https://t.me/${data.telegram}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm flex items-center gap-1.5 transition-colors">
                  ✈️ Telegram
                </a>
              )}
            </div>
            {/* Description */}
            {data.description && (
              <div>
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">About</p>
                <p className="text-gray-300 text-sm leading-relaxed">{data.description}</p>
              </div>
            )}
            {/* Full contract */}
            <div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Contract Address</p>
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <span className="text-gray-300 text-xs font-mono break-all">{data.address}</span>
                <CopyButton text={data.address} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
    }
