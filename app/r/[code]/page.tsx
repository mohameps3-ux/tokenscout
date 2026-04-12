"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Zap, Gift, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Auto-claim on mount
  useEffect(() => {
    if (!code) return;

    const claim = async () => {
      setStatus("claiming");
      try {
        // Ensure session exists first
        await fetch("/api/user");

        const res = await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Referral applied! Your friend earned 100 points.");
          setTimeout(() => router.push("/"), 2500);
        } else {
          // Already claimed or self-referral — still redirect
          setStatus("error");
          setMessage(data.error ?? "Could not apply referral.");
          setTimeout(() => router.push("/"), 2500);
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Redirecting…");
        setTimeout(() => router.push("/"), 2000);
      }
    };

    claim();
  }, [code, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 group-hover:bg-blue-500 transition-colors">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl">
            Token<span className="text-blue-400">Scout</span>
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-5">
          <div className="flex justify-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors ${
              status === "success"
                ? "border-emerald-500 bg-emerald-500/10"
                : status === "error"
                  ? "border-zinc-600 bg-zinc-800"
                  : "border-blue-500 bg-blue-500/10"
            }`}>
              {status === "success"
                ? <Check className="h-7 w-7 text-emerald-400" />
                : <Gift className={`h-7 w-7 ${status === "claiming" ? "text-blue-400 animate-pulse" : "text-blue-400"}`} />
              }
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              {status === "success" ? "Welcome to TokenScout!" : "You've been invited!"}
            </h1>
            <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
              {status === "idle" || status === "claiming"
                ? `Applying referral code: ${code?.toUpperCase() ?? "…"}`
                : message}
            </p>
          </div>

          {status === "idle" || status === "claiming" ? (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
              <span className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              Setting up your account…
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Go to TokenScout <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Feature highlights */}
          <div className="border-t border-zinc-800 pt-4 grid grid-cols-3 gap-3 text-xs">
            {[
              { label: "Live Prices", sub: "30s refresh" },
              { label: "Safety Score", sub: "Anti-rug" },
              { label: "AI Predict", sub: "Beat the AI" },
            ].map(({ label, sub }) => (
              <div key={label} className="text-center">
                <p className="text-zinc-300 font-medium">{label}</p>
                <p className="text-zinc-600">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
