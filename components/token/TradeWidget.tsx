"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, Zap } from "lucide-react";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";

interface TradeWidgetProps {
  chain: string;
  address: string;
  pairAddress: string | null;
}

declare global {
  interface Window {
    Jupiter?: {
      init: (opts: Record<string, unknown>) => void;
    };
  }
}

export function TradeWidget({ chain, address, pairAddress }: TradeWidgetProps) {
  const normalized = normalizeChain(chain) ?? "BASE";
  const cfg = CHAIN_CONFIG[normalized];
  const trades = cfg.tradeLinks(address, pairAddress);
  const isSolana = normalized === "SOLANA";
  const jupiterLoaded = useRef(false);

  useEffect(() => {
    if (!isSolana || jupiterLoaded.current) return;

    const initJupiter = () => {
      window.Jupiter?.init({
        displayMode: "integrated",
        integratedTargetId: "jupiter-terminal-container",
        endpoint: "https://api.mainnet-beta.solana.com",
        defaultExplorer: "Solscan",
        formProps: { fixedOutputMint: address },
      });
      jupiterLoaded.current = true;
    };

    if (window.Jupiter) {
      initJupiter();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://terminal.jup.ag/main-v3.js";
    script.async = true;
    script.onload = initJupiter;
    document.head.appendChild(script);
  }, [address, isSolana]);

  if (isSolana) {
    return (
      <div className="space-y-4">
        <div
          id="jupiter-terminal-container"
          className="rounded-xl overflow-hidden border border-zinc-800 min-h-[480px] bg-zinc-900/50 flex items-center justify-center"
        >
          <p className="text-zinc-600 text-sm">Loading Jupiter swap widget…</p>
        </div>
        <p className="text-xs text-zinc-600 text-center">
          Powered by{" "}
          <a
            href="https://jup.ag"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-400 underline"
          >
            Jupiter
          </a>
          . Always verify the token address before trading.
        </p>
      </div>
    );
  }

  // EVM: link panel
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
      <div>
        <p className="text-sm font-semibold text-white mb-1">Trade on {cfg.label}</p>
        <p className="text-xs text-zinc-500">
          Click a DEX below to open the swap interface with this token pre-loaded.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {trades.map(({ label, url, color }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium hover:opacity-80 transition-opacity ${color}`}
          >
            <Zap className="w-4 h-4" />
            {label}
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        ))}
      </div>

      <p className="text-xs text-zinc-600">
        You will be redirected to a third-party exchange. Always verify the contract
        address before confirming any transaction.
      </p>
    </div>
  );
}
