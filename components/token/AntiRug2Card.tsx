"use client";

import { Shield, AlertTriangle, ShieldCheck, ShieldX, Users, Lock, FileCode } from "lucide-react";
import type { RiskLevel } from "@/lib/scoring/scorer";

interface AntiRug2Props {
  contractSafety: number;
  liquiditySafety: number;
  teamSafety: number;
  riskLevel: RiskLevel;
  insiderBuyCount: number;
  isHoneypot: boolean;
  hasBundledBuys: boolean;
  flags: string[];
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: typeof Shield }> = {
  SAFE:   { label: "SAFE",   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: ShieldCheck },
  LOW:    { label: "LOW RISK",  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    icon: Shield      },
  MEDIUM: { label: "MEDIUM",    color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  icon: Shield      },
  HIGH:   { label: "HIGH RISK", color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  icon: AlertTriangle },
  DANGER: { label: "DANGER",    color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: ShieldX     },
};

function SafetyBar({ label, score, icon: Icon }: { label: string; score: number; icon: typeof Shield }) {
  const color =
    score >= 75 ? "bg-emerald-500" :
    score >= 50 ? "bg-blue-500"    :
    score >= 30 ? "bg-yellow-500"  :
    score >= 15 ? "bg-orange-500"  :
    "bg-red-500";

  const textColor =
    score >= 75 ? "text-emerald-400" :
    score >= 50 ? "text-blue-400"    :
    score >= 30 ? "text-yellow-400"  :
    score >= 15 ? "text-orange-400"  :
    "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className={`font-bold tabular-nums ${textColor}`}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function AntiRug2Card({
  contractSafety, liquiditySafety, teamSafety,
  riskLevel, insiderBuyCount, isHoneypot, hasBundledBuys, flags,
}: AntiRug2Props) {
  const cfg = RISK_CONFIG[riskLevel];
  const RiskIcon = cfg.icon;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Anti-Rug 2.0</p>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
          <RiskIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>

      {/* Three safety bars */}
      <div className="space-y-3">
        <SafetyBar label="Contract Safety" score={contractSafety} icon={FileCode} />
        <SafetyBar label="Liquidity Safety" score={liquiditySafety} icon={Lock} />
        <SafetyBar label="Team Safety" score={teamSafety} icon={Users} />
      </div>

      {/* Insider detection */}
      {insiderBuyCount > 0 && (
        <div className={`rounded-lg px-3 py-2.5 border space-y-1.5 ${
          insiderBuyCount >= 10
            ? "bg-red-500/10 border-red-500/20"
            : "bg-orange-500/10 border-orange-500/20"
        }`}>
          <div className={`flex items-center gap-2 text-xs ${insiderBuyCount >= 10 ? "text-red-400" : "text-orange-400"}`}>
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">Coordinated Buy Detected</span>
            <span className={`ml-auto font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
              insiderBuyCount >= 10 ? "bg-red-500/20" : "bg-orange-500/20"
            }`}>
              ~{insiderBuyCount} wallets
            </span>
          </div>
          <p className="text-xs text-zinc-500 pl-5">
            {insiderBuyCount >= 10
              ? `${insiderBuyCount} suspected insider wallets coordinated buys within the first hour of trading. High probability of organized pump.`
              : `${insiderBuyCount} wallet${insiderBuyCount !== 1 ? "s" : ""} showed coordinated buy behaviour within the first hour — possible team or insider activity.`}
          </p>
          <div className="pl-5 flex gap-2 flex-wrap">
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
              First-hour concentration
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              insiderBuyCount >= 10
                ? "text-red-400 bg-red-500/10"
                : "text-orange-400 bg-orange-500/10"
            }`}>
              {insiderBuyCount >= 10 ? "Very High Risk" : insiderBuyCount >= 5 ? "High Risk" : "Moderate Risk"}
            </span>
          </div>
        </div>
      )}

      {/* Honeypot warning */}
      {isHoneypot && (
        <div className="flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400">
          <ShieldX className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Honeypot Pattern</span>
            <span className="ml-1 text-zinc-400">Sells blocked — you may not be able to exit</span>
          </div>
        </div>
      )}

      {/* Bundled buys */}
      {hasBundledBuys && !isHoneypot && (
        <div className="flex items-start gap-2 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-yellow-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Bundled buy pattern detected in first hour of trading</span>
        </div>
      )}

      {/* Flags list */}
      {flags.length > 0 && (
        <div className="space-y-1">
          {flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
              <span className="text-orange-500 shrink-0 mt-0.5">⚠</span>
              {flag}
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-700 leading-relaxed">
        Scores based on on-chain trading patterns and liquidity analysis. Liquidity lock and contract
        verification status require chain-specific API access.
      </p>
    </div>
  );
}
