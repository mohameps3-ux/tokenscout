"use client";

import { useEffect, useState } from "react";
import { Users, FileCode } from "lucide-react";

interface Holder {
  address: string;
  tag: string | null;
  isContract: boolean;
  percent: number;
}

interface SecurityResult {
  holders: Holder[];
  creatorAddress: string | null;
  ownerAddress: string | null;
}

interface TokenHoldersSectionProps {
  chain: string;
  address: string;
}

export function TokenHoldersSection({ chain, address }: TokenHoldersSectionProps) {
  const [data, setData] = useState<SecurityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/token/${chain.toLowerCase()}/${address}/security`)
      .then((r) => r.json())
      .then((j) => {
        if (j.result) setData(j.result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chain, address]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-zinc-800/60 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const holders = data?.holders ?? [];
  if (holders.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Users className="w-4 h-4 text-zinc-500" />
        <p className="text-sm font-semibold text-white">Top Holders</p>
        <span className="ml-auto text-xs text-zinc-600">Top {holders.length}</span>
      </div>
      <div className="divide-y divide-zinc-800/40">
        {holders.map((h, i) => (
          <div key={h.address} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-xs text-zinc-600 w-5 shrink-0 tabular-nums">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-300 font-mono truncate">
                  {h.tag ?? `${h.address.slice(0, 6)}...${h.address.slice(-4)}`}
                </span>
                {h.isContract && (
                  <span className="flex items-center gap-0.5 text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full shrink-0">
                    <FileCode className="w-2.5 h-2.5" />
                    Contract
                  </span>
                )}
                {data?.creatorAddress && h.address.toLowerCase() === data.creatorAddress.toLowerCase() && (
                  <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                    Deployer
                  </span>
                )}
              </div>
              {/* Bar */}
              <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    h.percent > 20 ? "bg-red-500" :
                    h.percent > 10 ? "bg-orange-500" :
                    h.percent > 5  ? "bg-yellow-500" :
                    "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, h.percent * 5)}%` }}
                />
              </div>
            </div>
            <span className={`text-xs font-bold tabular-nums shrink-0 ${
              h.percent > 20 ? "text-red-400" :
              h.percent > 10 ? "text-orange-400" :
              h.percent > 5  ? "text-yellow-400" :
              "text-zinc-400"
            }`}>
              {h.percent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-zinc-800/40">
        <p className="text-[10px] text-zinc-700">
          Source: GoPlus Security. Concentration risk: holders with &gt;10% represent elevated risk.
        </p>
      </div>
    </div>
  );
}
