"use client";

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

interface MarketStatsBarProps {
  global: GlobalData | null;
  fearGreed: FearGreed | null;
  lastUpdated: Date;
}

function fgColor(val: number) {
  if (val >= 75) return "text-emerald-400";
  if (val >= 55) return "text-green-400";
  if (val >= 45) return "text-yellow-400";
  if (val >= 25) return "text-orange-400";
  return "text-red-400";
}

export function MarketStatsBar({ global: g, fearGreed: fg, lastUpdated }: MarketStatsBarProps) {
  const fgVal = fg ? parseInt(fg.value) : null;
  const mcapChange = g?.market_cap_change_percentage_24h_usd ?? null;

  return (
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
          <Stat
            label="Fear & Greed"
            value={`${fgVal} — ${fg.value_classification}`}
            valueColor={fgColor(fgVal)}
          />
        )}
        <span className="ml-auto shrink-0 text-zinc-600">
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      </div>
    </div>
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
