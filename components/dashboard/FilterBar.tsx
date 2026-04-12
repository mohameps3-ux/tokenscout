"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RefreshCw, Lock } from "lucide-react";
import Link from "next/link";
import { CHAINS, CHAIN_CONFIG } from "@/lib/chains";

export function FilterBar({ tier = "FREE" }: { tier?: "FREE" | "PRO" }) {
  const isPro = tier === "PRO";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const chain = searchParams.get("chain") ?? "ALL";
  const minScore = searchParams.get("minScore") ?? "0";
  const minLiquidity = searchParams.get("minLiquidity") ?? "0";
  const age = searchParams.get("age") ?? "ALL";
  const sort = searchParams.get("sort") ?? "score";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "0" || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const reset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="space-y-3">
      {/* Network pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => updateParam("chain", "ALL")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            chain === "ALL"
              ? "bg-zinc-200 text-zinc-900 border-zinc-200"
              : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
          }`}
        >
          All
        </button>
        {CHAINS.map((c) => {
          const cfg = CHAIN_CONFIG[c];
          const active = chain === c;
          return (
            <button
              key={c}
              onClick={() => updateParam("chain", c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? `${cfg.color} border-current bg-current/10`
                  : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Other filters row */}
      <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-zinc-400">
        <SlidersHorizontal className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <Select
        value={minScore}
        onChange={(e) => updateParam("minScore", e.target.value)}
        aria-label="Minimum score"
      >
        <option value="0">Any Score</option>
        <option value="25">25+ Score</option>
        <option value="50">50+ Score</option>
        <option value="75">75+ Score</option>
      </Select>

      <Select
        value={minLiquidity}
        onChange={(e) => updateParam("minLiquidity", e.target.value)}
        aria-label="Minimum liquidity"
      >
        <option value="0">Any Liquidity</option>
        <option value="1000">$1K+ Liq</option>
        <option value="10000">$10K+ Liq</option>
        <option value="50000">$50K+ Liq</option>
      </Select>

      <Select
        value={age}
        onChange={(e) => updateParam("age", e.target.value)}
        aria-label="Token age"
      >
        <option value="ALL">Any Age</option>
        <option value="1h">Under 1h</option>
        <option value="24h">Under 24h</option>
        <option value="7d">Under 7d</option>
      </Select>

      <Select
        value={sort}
        onChange={(e) => updateParam("sort", e.target.value)}
        aria-label="Sort by"
      >
        <option value="score">Sort: Score</option>
        <option value="liquidity">Sort: Liquidity</option>
        <option value="volume">Sort: Volume</option>
        <option value="age">Sort: Newest</option>
        <option value="change">Sort: 24h Change</option>
      </Select>

      {(chain !== "ALL" || minScore !== "0" || minLiquidity !== "0" || age !== "ALL") && (
        <Button variant="ghost" size="sm" onClick={reset}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      )}

      {isPending && (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}

      {/* Free tier badge */}
      {!isPro && (
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 ml-auto text-xs text-amber-400/80 hover:text-amber-400 transition-colors"
        >
          <Lock className="w-3 h-3" />
          <span>Top 10 only — Upgrade for all tokens</span>
        </Link>
      )}
      </div>
    </div>
  );
}
