"use client";

import { useState } from "react";
import { ChevronDown, X, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatUsd } from "@/lib/utils";

interface GlobalData {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { btc: number };
  market_cap_change_percentage_24h_usd: number;
}

interface FearGreed {
  value: string;
  value_classification: string;
}

interface FearGreedPoint {
  value: number;
  label: string;
  timestamp: number;
}

interface MarketStatsBarProps {
  global: GlobalData | null;
  fearGreed: FearGreed | null;
  fearGreedHistory: FearGreedPoint[];
  lastUpdated: Date;
}

function fgColor(val: number) {
  if (val >= 75) return "text-emerald-400";
  if (val >= 55) return "text-green-400";
  if (val >= 45) return "text-yellow-400";
  if (val >= 25) return "text-orange-400";
  return "text-red-400";
}

function fgBg(val: number) {
  if (val >= 75) return "#10b981";
  if (val >= 55) return "#22c55e";
  if (val >= 45) return "#eab308";
  if (val >= 25) return "#f97316";
  return "#ef4444";
}

function fgZone(val: number): string {
  if (val >= 75) return "Extreme Greed";
  if (val >= 55) return "Greed";
  if (val >= 45) return "Neutral";
  if (val >= 25) return "Fear";
  return "Extreme Fear";
}

export function MarketStatsBar({ global: g, fearGreed: fg, fearGreedHistory, lastUpdated }: MarketStatsBarProps) {
  const [fgExpanded, setFgExpanded] = useState(false);
  const fgVal = fg ? parseInt(fg.value) : null;
  const mcapChange = g?.market_cap_change_percentage_24h_usd ?? null;

  const chartData = fearGreedHistory.map((p) => ({
    date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: p.value,
    color: fgBg(p.value),
  }));

  return (
    <>
      <div className="w-full border-b border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-400 overflow-x-auto">
          {g && (
            <>
              <Stat
                label="Market Cap"
                value={formatUsd(g.total_market_cap.usd, true)}
                sub={mcapChange != null ? `${mcapChange >= 0 ? "+" : ""}${mcapChange.toFixed(2)}% 24h` : undefined}
                subColor={mcapChange != null ? (mcapChange >= 0 ? "text-emerald-400" : "text-red-400") : undefined}
              />
              <Stat label="24h Volume" value={formatUsd(g.total_volume.usd, true)} />
              <Stat label="BTC Dominance" value={`${g.market_cap_percentage.btc.toFixed(1)}%`} />
            </>
          )}
          {fg && fgVal !== null && (
            <button
              onClick={() => setFgExpanded((v) => !v)}
              className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
            >
              <span className="text-zinc-600">Fear &amp; Greed:</span>
              <span className={`font-medium ${fgColor(fgVal)}`}>{fgVal} — {fg.value_classification}</span>
              <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${fgExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
          <span className="ml-auto shrink-0 text-zinc-600">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Expandable F&G panel */}
      {fgExpanded && fgVal !== null && (
        <div className="w-full border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Fear &amp; Greed Index — 30 Day History</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  A composite index measuring market sentiment based on volatility, momentum, social media, surveys, dominance, and trends.
                </p>
              </div>
              <button onClick={() => setFgExpanded(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors ml-4 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-500 mb-1">Current</p>
                <p className={`text-2xl font-bold ${fgColor(fgVal)}`}>{fgVal}</p>
                <p className={`text-sm font-medium ${fgColor(fgVal)}`}>{fgZone(fgVal)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-500 mb-1">Index Zones</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-emerald-400">75–100</span><span className="text-zinc-400">Extreme Greed — sell signal</span></div>
                  <div className="flex justify-between"><span className="text-green-400">55–74</span><span className="text-zinc-400">Greed — caution</span></div>
                  <div className="flex justify-between"><span className="text-yellow-400">45–54</span><span className="text-zinc-400">Neutral</span></div>
                  <div className="flex justify-between"><span className="text-orange-400">25–44</span><span className="text-zinc-400">Fear — potential buy</span></div>
                  <div className="flex justify-between"><span className="text-red-400">0–24</span><span className="text-zinc-400">Extreme Fear — strong buy</span></div>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> How it works</p>
                <div className="space-y-0.5 text-[11px] text-zinc-400">
                  <p>• <span className="text-zinc-300">Volatility</span> (25%)</p>
                  <p>• <span className="text-zinc-300">Market Momentum</span> (25%)</p>
                  <p>• <span className="text-zinc-300">Social Media</span> (15%)</p>
                  <p>• <span className="text-zinc-300">Surveys</span> (15%)</p>
                  <p>• <span className="text-zinc-300">BTC Dominance</span> (10%)</p>
                  <p>• <span className="text-zinc-300">Google Trends</span> (10%)</p>
                </div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fgGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#52525b" }}
                      tickLine={false}
                      axisLine={false}
                      interval={6}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#52525b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "#a1a1aa" }}
                      formatter={(value) => {
                        const n = Number(value);
                        return [`${n} — ${fgZone(n)}`, "F&G Index"];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#fgGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, sub, subColor, valueColor }: {
  label: string; value: string; sub?: string; subColor?: string; valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-zinc-600">{label}:</span>
      <span className={`font-medium text-zinc-200 ${valueColor ?? ""}`}>{value}</span>
      {sub && <span className={`text-[11px] ${subColor ?? "text-zinc-500"}`}>{sub}</span>}
    </div>
  );
}
