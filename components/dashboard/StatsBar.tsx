import { formatUsd, formatNumber } from "@/lib/utils";

interface StatsBarProps {
  totalTokens: number;
  baseTokens: number;
  solanaTokens: number;
  avgScore: number;
  topLiquidity: number;
  lastUpdated: string;
}

export function StatsBar({
  totalTokens,
  baseTokens,
  solanaTokens,
  avgScore,
  topLiquidity,
  lastUpdated,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatItem label="Total Tokens" value={formatNumber(totalTokens)} />
      <StatItem label="Base" value={formatNumber(baseTokens)} />
      <StatItem label="Solana" value={formatNumber(solanaTokens)} />
      <StatItem label="Avg Score" value={avgScore.toFixed(1)} />
      <StatItem label="Top Liquidity" value={formatUsd(topLiquidity, true)} />
      <StatItem
        label="Last Scan"
        value={new Date(lastUpdated).toLocaleTimeString()}
      />
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
    </div>
  );
}
