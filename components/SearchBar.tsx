"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, AlertTriangle, Loader2 } from "lucide-react";
import { formatUsd, truncateAddress } from "@/lib/utils";

interface SearchResult {
  address: string;
  chain: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  totalScore: number;
  liquidity: number | null;
  isHoneypot: boolean;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(`/token/${result.chain.toLowerCase()}/${result.address}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      navigate(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search token name or address…"
          className="w-full h-9 pl-9 pr-8 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-zinc-500 animate-spin" />
        )}
        {!loading && query.length > 0 && (
          <button onClick={clear} className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40 z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-500 text-center">
              No tokens found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={`${r.chain}-${r.address}`}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); navigate(r); }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIdx ? "bg-zinc-800" : "hover:bg-zinc-800/60"
                    }`}
                  >
                    {/* Token identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{r.symbol}</span>
                        <span className="text-xs text-zinc-500 truncate">{r.name}</span>
                        {r.isHoneypot && (
                          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-zinc-600 font-mono truncate mt-0.5">
                        {truncateAddress(r.address, 6)}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {r.priceUsd != null && (
                        <span className="text-zinc-300">{formatUsd(r.priceUsd)}</span>
                      )}
                      <span className={`font-semibold ${scoreColor(r.totalScore)}`}>
                        {r.totalScore}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-zinc-400 ${
                        r.chain === "SOLANA" ? "bg-purple-500/15" : "bg-blue-500/15"
                      }`}>
                        {r.chain === "SOLANA" ? "SOL" : "BASE"}
                      </span>
                    </div>
                  </button>
                  {i < results.length - 1 && (
                    <div className="h-px bg-zinc-800/60 mx-3" />
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 py-1.5 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-600">{results.length} result{results.length !== 1 ? "s" : ""}</span>
            <span className="text-xs text-zinc-600">↑↓ navigate · ↵ open · esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}
