"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Send, Lock } from "lucide-react";
import { CHAINS } from "@/lib/chains";

interface AlertRule {
  id: string;
  enabled: boolean;
  label: string | null;
  telegramChatId: string;
  minScore: number;
  minAiScore: number;
  minLiquidity: number | null;
  chain: string | null;
  minPriceChange: number | null;
  createdAt: string;
}

interface AlertsState {
  rules: AlertRule[];
  tier: string;
  limit: number | null; // null = unlimited
}

export function AlertsManager() {
  const [state, setState] = useState<AlertsState>({ rules: [], tier: "FREE", limit: 1 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "",
    telegramChatId: "",
    minScore: 75,
    minAiScore: 0,
    minLiquidity: "",
    chain: "",
    minPriceChange: "",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) =>
        setState({
          rules: d.rules ?? [],
          tier: d.tier ?? "FREE",
          limit: d.limit ?? 1,
        })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const atLimit =
    state.limit !== null && state.rules.length >= state.limit;

  const handleCreate = async () => {
    if (!form.telegramChatId.trim()) {
      setError("Telegram Chat ID is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label || null,
          telegramChatId: form.telegramChatId.trim(),
          minScore: form.minScore,
          minAiScore: form.minAiScore,
          minLiquidity: form.minLiquidity ? parseFloat(form.minLiquidity) : null,
          chain: form.chain || null,
          minPriceChange: form.minPriceChange ? parseFloat(form.minPriceChange) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create rule");
        return;
      }
      setState((prev) => ({ ...prev, rules: [data.rule, ...prev.rules] }));
      setShowForm(false);
      setForm({
        label: "",
        telegramChatId: "",
        minScore: 75,
        minAiScore: 0,
        minLiquidity: "",
        chain: "",
        minPriceChange: "",
      });
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: AlertRule) => {
    setState((prev) => ({
      ...prev,
      rules: prev.rules.map((r) =>
        r.id === rule.id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
    await fetch(`/api/alerts/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    }).catch(() => load());
  };

  const handleDelete = async (id: string) => {
    setState((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== id) }));
    await fetch(`/api/alerts/${id}`, { method: "DELETE" }).catch(() => load());
  };

  const tierLabel =
    state.tier === "FREE"
      ? "Free — 1 rule"
      : state.tier === "PRO"
      ? "Pro — 3 rules"
      : "Super Pro — unlimited";

  return (
    <div className="space-y-5">
      {/* Tier info + header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{tierLabel}</span>
          {state.limit !== null && (
            <span className="text-xs text-zinc-600">
              ({state.rules.length}/{state.limit} used)
            </span>
          )}
        </div>
        <button
          onClick={() => {
            if (atLimit) return;
            setShowForm((v) => !v);
            setError(null);
          }}
          disabled={atLimit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {atLimit ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              Limit reached
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              New Rule
            </>
          )}
        </button>
      </div>

      {/* Upgrade prompt */}
      {atLimit && state.tier === "FREE" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
          Free users get 1 alert rule.{" "}
          <a href="/pricing" className="underline hover:text-amber-300">
            Upgrade to Pro
          </a>{" "}
          for 3 rules.
        </div>
      )}
      {atLimit && state.tier === "PRO" && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-3 text-xs text-zinc-400">
          Pro users get up to 3 alert rules. Super Pro unlocks unlimited rules.
        </div>
      )}

      {/* Create form */}
      {showForm && !atLimit && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-300">Create Alert Rule</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Rule Label (optional)</span>
              <input
                type="text"
                placeholder="e.g. Solana high-score"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full text-sm bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-500">
                Telegram Chat ID <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                placeholder="e.g. 123456789"
                value={form.telegramChatId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telegramChatId: e.target.value }))
                }
                className="w-full text-sm bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-500">
                Min Safety Score:{" "}
                <span className="text-blue-400 font-bold">{form.minScore}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.minScore}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minScore: parseInt(e.target.value) }))
                }
                className="w-full accent-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-500">
                Min AI Confidence:{" "}
                <span className="text-purple-400 font-bold">{form.minAiScore}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.minAiScore}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minAiScore: parseInt(e.target.value) }))
                }
                className="w-full accent-purple-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Network</span>
              <select
                value={form.chain}
                onChange={(e) => setForm((f) => ({ ...f, chain: e.target.value }))}
                className="w-full text-sm bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Networks</option>
                {CHAINS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Min Liquidity ($)</span>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={form.minLiquidity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minLiquidity: e.target.value }))
                }
                className="w-full text-sm bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Min Price Change % (abs)</span>
              <input
                type="number"
                placeholder="e.g. 20"
                value={form.minPriceChange}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minPriceChange: e.target.value }))
                }
                className="w-full text-sm bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </label>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Example preview */}
          <div className="rounded-lg bg-zinc-900/60 border border-zinc-700/60 p-2.5 text-xs text-zinc-500">
            <span className="text-zinc-400">Example alert: </span>
            Score ≥ {form.minScore}
            {form.minAiScore > 0 && ` · AI ≥ ${form.minAiScore}%`}
            {form.chain && ` · ${form.chain}`}
            {form.minLiquidity && ` · Liq ≥ $${Number(form.minLiquidity).toLocaleString()}`}
            {form.minPriceChange && ` · Change ≥ ${form.minPriceChange}%`}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Create Rule
                </>
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : state.rules.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Bell className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-zinc-500 text-sm">No alert rules yet.</p>
          <p className="text-zinc-600 text-xs">
            Create a rule to get Telegram notifications when tokens match your criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.rules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-xl border p-3 transition-colors ${
                rule.enabled
                  ? "border-zinc-700 bg-zinc-900/40"
                  : "border-zinc-800 bg-zinc-900/20 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(rule)}
                  className="mt-0.5 text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-5 h-5 text-blue-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {rule.label && (
                      <span className="text-sm font-medium text-white">{rule.label}</span>
                    )}
                    <span className="text-xs text-zinc-500 font-mono truncate">
                      {rule.telegramChatId}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Chip color="blue">Score ≥ {rule.minScore}</Chip>
                    {rule.minAiScore > 0 && (
                      <Chip color="purple">AI ≥ {rule.minAiScore}%</Chip>
                    )}
                    {rule.chain && <Chip color="violet">{rule.chain}</Chip>}
                    {rule.minLiquidity && (
                      <Chip color="emerald">
                        Liq ≥ ${(rule.minLiquidity / 1000).toFixed(0)}K
                      </Chip>
                    )}
                    {rule.minPriceChange && (
                      <Chip color="amber">Change ≥ {rule.minPriceChange}%</Chip>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  const cls: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span
      className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${
        cls[color] ?? ""
      }`}
    >
      {children}
    </span>
  );
}
