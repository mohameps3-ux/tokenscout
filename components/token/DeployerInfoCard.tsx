"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Lock, Unlock, ShieldCheck, ShieldX } from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";

interface SecurityResult {
  creatorAddress: string | null;
  ownerAddress: string | null;
  isOpenSource: boolean;
  isProxy: boolean;
  isMintable: boolean;
  canTakeBackOwnership: boolean;
  ownerChangeBalance: boolean;
  isHoneypot: boolean;
  buyTax: number | null;
  sellTax: number | null;
  isBlacklisted: boolean;
  tradingCooldown: boolean;
  ownershipRenounced: boolean;
  liquidityLockedPct: number;
  lpHolders: {
    address: string;
    tag: string | null;
    isLocked: boolean;
    percent: number;
    lockUntil: string | null;
  }[];
  explorerUrl: string | null;
}

interface DeployerInfoCardProps {
  chain: string;
  address: string;
}

export function DeployerInfoCard({ chain, address }: DeployerInfoCardProps) {
  const [result, setResult] = useState<SecurityResult | null>(null);
  const [loading, setLoading] = useState(true);

  const normalized = normalizeChain(chain) ?? "BASE";
  const cfg = CHAIN_CONFIG[normalized];

  useEffect(() => {
    fetch(`/api/token/${chain.toLowerCase()}/${address}/security`)
      .then((r) => r.json())
      .then((d) => {
        setResult(d.result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chain, address]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <div className="h-3 bg-zinc-800 rounded animate-pulse w-36" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-zinc-800/60 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!result) return null;

  const riskFlags: string[] = [];
  if (result.isMintable) riskFlags.push("Can mint unlimited tokens");
  if (result.canTakeBackOwnership) riskFlags.push("Owner can reclaim contract");
  if (result.ownerChangeBalance) riskFlags.push("Owner can modify balances");
  if (!result.isOpenSource) riskFlags.push("Contract source not verified");
  if (result.isProxy) riskFlags.push("Proxy contract — logic can change");
  if (result.isBlacklisted) riskFlags.push("Blacklist function present");
  if (result.tradingCooldown) riskFlags.push("Trading cooldown mechanism");
  if (result.buyTax != null && result.buyTax > 0.1)
    riskFlags.push(`High buy tax: ${(result.buyTax * 100).toFixed(1)}%`);
  if (result.sellTax != null && result.sellTax > 0.1)
    riskFlags.push(`High sell tax: ${(result.sellTax * 100).toFixed(1)}%`);

  const isHighRisk =
    riskFlags.length >= 2 ||
    result.isMintable ||
    result.canTakeBackOwnership ||
    result.ownerChangeBalance ||
    result.isHoneypot;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
          Contract Security
        </p>
        {isHighRisk && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            HIGH RISK — Deployer
          </span>
        )}
        {!isHighRisk && riskFlags.length === 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Clean
          </span>
        )}
      </div>

      {/* Security checks grid */}
      <div className="space-y-2.5">
        <SecurityRow
          label="Contract Verified"
          ok={result.isOpenSource}
          trueText="Open source ✓"
          falseText="Unverified source"
        />
        <SecurityRow
          label="Ownership"
          ok={result.ownershipRenounced}
          trueText="Renounced"
          falseText="Owner has control"
        />
        <SecurityRow
          label="Mintable"
          ok={!result.isMintable}
          trueText="Fixed supply"
          falseText="Can mint tokens"
          invertColors
        />

        {/* Liquidity lock */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 flex items-center gap-1.5">
            {result.liquidityLockedPct >= 50 ? (
              <Lock className="w-3 h-3 text-emerald-400" />
            ) : (
              <Unlock className="w-3 h-3 text-red-400" />
            )}
            Liquidity Locked
          </span>
          <span
            className={`font-semibold ${
              result.liquidityLockedPct >= 80
                ? "text-emerald-400"
                : result.liquidityLockedPct >= 30
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {result.liquidityLockedPct > 0
              ? `${result.liquidityLockedPct.toFixed(0)}%`
              : "Not locked"}
          </span>
        </div>

        {/* Tax display */}
        {(result.buyTax != null || result.sellTax != null) && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Buy / Sell Tax</span>
            <span
              className={`font-semibold ${
                (result.buyTax ?? 0) > 0.1 || (result.sellTax ?? 0) > 0.1
                  ? "text-orange-400"
                  : "text-emerald-400"
              }`}
            >
              {result.buyTax != null ? `${(result.buyTax * 100).toFixed(1)}%` : "—"} /{" "}
              {result.sellTax != null ? `${(result.sellTax * 100).toFixed(1)}%` : "—"}
            </span>
          </div>
        )}
      </div>

      {/* Deployer address */}
      {result.creatorAddress && (
        <div className="pt-2 border-t border-zinc-800/60 space-y-1">
          <p className="text-xs text-zinc-500">Deployer</p>
          <a
            href={cfg.explorerUrl(result.creatorAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {truncateAddress(result.creatorAddress)}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      )}

      {/* LP Holders */}
      {result.lpHolders.length > 0 && (
        <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
          <p className="text-xs text-zinc-500">LP Holders</p>
          {result.lpHolders.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-500">
                {h.tag ?? truncateAddress(h.address)}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">{h.percent.toFixed(1)}%</span>
                {h.isLocked ? (
                  <span className="text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    Locked
                  </span>
                ) : (
                  <span className="text-zinc-600 text-[10px]">Unlocked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
          {riskFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-orange-400">
              <ShieldX className="w-3 h-3 shrink-0 mt-0.5" />
              {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityRow({
  label,
  ok,
  trueText,
  falseText,
  invertColors,
}: {
  label: string;
  ok: boolean;
  trueText: string;
  falseText: string;
  invertColors?: boolean;
}) {
  const isGood = invertColors ? !ok : ok;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-semibold ${isGood ? "text-emerald-400" : "text-red-400"}`}>
        {ok ? trueText : falseText}
      </span>
    </div>
  );
}
