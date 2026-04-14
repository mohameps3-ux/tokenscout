"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, TrendingDown, Info, ChevronDown } from "lucide-react";

interface Indicators {
  puellMultiple: number | null;
  piCycle: {
    ma111: number | null;
    ma350x2: number | null;
    ratio: number | null;
    currentPrice: number | null;
  };
  btcRsi: number | null;
  altcoinSeasonIndex: number | null;
  performanceBuckets: {
    strongLoss: number;
    loss: number;
    flat: number;
    gain: number;
    strongGain: number;
  };
  btcChange30d: number | null;
  etfStatus: {
    launched: boolean;
    launchDate: string;
    btcChange30d: number | null;
  };
}

function puellSignal(v: number): { label: string; color: string; bg: string } {
  if (v < 0.5) return { label: "Strong Buy Zone", color: "text-emerald-400", bg: "bg-emerald-500/20" };
  if (v < 1.0) return { label: "Accumulation", color: "text-green-400", bg: "bg-green-500/20" };
  if (v < 2.0) return { label: "Fair Value", color: "text-yellow-400", bg: "bg-yellow-500/20" };
  if (v < 4.0) return { label: "Caution", color: "text-orange-400", bg: "bg-orange-500/20" };
  return { label: "Sell Signal", color: "text-red-400", bg: "bg-red-500/20" };
}

function piCycleSignal(ratio: number): { label: string; color: string } {
  if (ratio >= 1.0) return { label: "⚠️ Top Signal", color: "text-red-400" };
  if (ratio >= 0.9) return { label: "Warning Zone", color: "text-orange-400" };
  if (ratio >= 0.7) return { label: "Neutral", color: "text-yellow-400" };
  return { label: "Early Cycle", color: "text-emerald-400" };
}

function rsiSignal(v: number): { label: string; color: string } {
  if (v >= 80) return { label: "Overbought", color: "text-red-400" };
  if (v >= 70) return { label: "High", color: "text-orange-400" };
  if (v >= 45) return { label: "Neutral", color: "text-yellow-400" };
  if (v >= 30) return { label: "Oversold", color: "text-green-400" };
  return { label: "Extreme Oversold", color: "text-emerald-400" };
}

function altcoinSignal(v: number): { label: string; color: string } {
  if (v >= 75) return { label: "Altcoin Season 🚀", color: "text-emerald-400" };
  if (v >= 55) return { label: "Altcoin Favored", color: "text-green-400" };
  if (v >= 45) return { label: "Mixed", color: "text-yellow-400" };
  if (v >= 25) return { label: "Bitcoin Season", color: "text-orange-400" };
  return { label: "Full BTC Season", color: "text-blue-400" };
}

function Gauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function MarketIndicators() {
  const [data, setData] = useState<Indicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/market/indicators")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !data) return null;

  const perf = data?.performanceBuckets;
  const total = perf ? Object.values(perf).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left"
      >
        <BarChart2 className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Market Cycle Indicators</h2>
        <span className="text-xs text-zinc-600">on-chain signals · updated hourly</span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Puell Multiple */}
          <IndicatorCard
            title="Puell Multiple"
            loading={loading}
            tooltip="BTC price relative to its 365-day average. Measures miner profitability cycles."
          >
            {data?.puellMultiple != null && (() => {
              const sig = puellSignal(data.puellMultiple);
              return (
                <>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-2xl font-bold text-white">{data.puellMultiple.toFixed(2)}×</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sig.bg} ${sig.color}`}>{sig.label}</span>
                  </div>
                  <Gauge value={Math.min(data.puellMultiple, 5)} max={5} color={data.puellMultiple < 1 ? "bg-emerald-500" : data.puellMultiple < 2 ? "bg-yellow-500" : "bg-red-500"} />
                  <p className="text-[11px] text-zinc-500 mt-1">Below 1.0 = miners earning less than yearly avg</p>
                </>
              );
            })()}
          </IndicatorCard>

          {/* Pi Cycle Top */}
          <IndicatorCard
            title="Pi Cycle Top"
            loading={loading}
            tooltip="Signals market tops when BTC's 111-day MA crosses above 2× the 350-day MA."
          >
            {data?.piCycle?.ratio != null && (() => {
              const sig = piCycleSignal(data.piCycle.ratio);
              return (
                <>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-2xl font-bold text-white">{(data.piCycle.ratio * 100).toFixed(1)}%</span>
                    <span className={`text-xs font-semibold ${sig.color}`}>{sig.label}</span>
                  </div>
                  <Gauge value={data.piCycle.ratio} max={1.1} color={data.piCycle.ratio >= 0.9 ? "bg-red-500" : data.piCycle.ratio >= 0.7 ? "bg-yellow-500" : "bg-emerald-500"} />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    111MA ${data.piCycle.ma111?.toLocaleString()} vs 2×350MA ${data.piCycle.ma350x2?.toLocaleString()}
                  </p>
                </>
              );
            })()}
          </IndicatorCard>

          {/* BTC RSI */}
          <IndicatorCard
            title="BTC RSI (14d)"
            loading={loading}
            tooltip="Relative Strength Index measures momentum. Above 70 = overbought, below 30 = oversold."
          >
            {data?.btcRsi != null && (() => {
              const sig = rsiSignal(data.btcRsi);
              return (
                <>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-2xl font-bold text-white">{data.btcRsi}</span>
                    <span className={`text-xs font-semibold ${sig.color}`}>{sig.label}</span>
                  </div>
                  <Gauge value={data.btcRsi} max={100} color={data.btcRsi >= 70 ? "bg-red-500" : data.btcRsi >= 45 ? "bg-yellow-500" : "bg-emerald-500"} />
                  <p className="text-[11px] text-zinc-500 mt-1">Based on daily BTC closing prices</p>
                </>
              );
            })()}
          </IndicatorCard>

          {/* Altcoin Season Index */}
          <IndicatorCard
            title="Altcoin Season Index"
            loading={loading}
            tooltip="% of top 50 altcoins outperforming Bitcoin over the past 7 days. 75%+ = altcoin season."
          >
            {data?.altcoinSeasonIndex != null && (() => {
              const sig = altcoinSignal(data.altcoinSeasonIndex);
              return (
                <>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-2xl font-bold text-white">{data.altcoinSeasonIndex}</span>
                    <span className={`text-xs font-semibold ${sig.color}`}>{sig.label}</span>
                  </div>
                  <Gauge value={data.altcoinSeasonIndex} max={100} color={data.altcoinSeasonIndex >= 75 ? "bg-emerald-500" : data.altcoinSeasonIndex >= 50 ? "bg-yellow-500" : "bg-blue-500"} />
                  <p className="text-[11px] text-zinc-500 mt-1">% of top 50 outperforming BTC (7d)</p>
                </>
              );
            })()}
          </IndicatorCard>

          {/* ETF Tracker */}
          <IndicatorCard
            title="BTC ETF Tracker"
            loading={loading}
            tooltip="Bitcoin spot ETFs launched Jan 10, 2024. BTC 30-day performance as demand proxy."
          >
            {data?.etfStatus && (() => {
              const ch = data.etfStatus.btcChange30d;
              const up = (ch ?? 0) >= 0;
              return (
                <>
                  <div className="flex items-end justify-between mt-2">
                    <span className={`text-2xl font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                      {ch != null ? `${up ? "+" : ""}${ch.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Live ✓</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {up ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                    <p className="text-[11px] text-zinc-500">BTC 30-day performance</p>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5">ETF launched {data.etfStatus.launchDate}</p>
                </>
              );
            })()}
          </IndicatorCard>

          {/* Top 100 Performance Distribution */}
          <IndicatorCard
            title="Top 100 · 7d Performance"
            loading={loading}
            tooltip="Distribution of 7-day price performance across top 100 coins by market cap."
          >
            {perf && total > 0 && (
              <>
                <div className="flex gap-0.5 mt-3 rounded overflow-hidden h-4">
                  {perf.strongLoss > 0 && <div className="bg-red-600" style={{ width: `${(perf.strongLoss / total) * 100}%` }} title={`< -20%: ${perf.strongLoss}`} />}
                  {perf.loss > 0 && <div className="bg-red-400" style={{ width: `${(perf.loss / total) * 100}%` }} title={`-5% to -20%: ${perf.loss}`} />}
                  {perf.flat > 0 && <div className="bg-zinc-500" style={{ width: `${(perf.flat / total) * 100}%` }} title={`-5% to +5%: ${perf.flat}`} />}
                  {perf.gain > 0 && <div className="bg-green-400" style={{ width: `${(perf.gain / total) * 100}%` }} title={`+5% to +20%: ${perf.gain}`} />}
                  {perf.strongGain > 0 && <div className="bg-emerald-500" style={{ width: `${(perf.strongGain / total) * 100}%` }} title={`> +20%: ${perf.strongGain}`} />}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
                  <span className="text-red-400">{perf.strongLoss + perf.loss} down</span>
                  <span className="text-zinc-400">{perf.flat} flat</span>
                  <span className="text-emerald-400">{perf.gain + perf.strongGain} up</span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-0.5">7-day returns · top 100 by mcap</p>
              </>
            )}
          </IndicatorCard>
        </div>
      )}
    </div>
  );
}

function IndicatorCard({
  title,
  tooltip,
  loading,
  children,
}: {
  title: string;
  tooltip: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1 relative">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-zinc-300">{title}</span>
        <button
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          className="text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <Info className="w-3 h-3" />
        </button>
        {showTip && (
          <div className="absolute top-8 left-0 z-20 w-56 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-[11px] text-zinc-400 shadow-xl">
            {tooltip}
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-12 mt-2 bg-zinc-800/50 rounded animate-pulse" />
      ) : children}
    </div>
  );
}
