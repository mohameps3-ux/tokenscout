"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, Zap } from "lucide-react";

const NAV = [
  { href: "/", label: "Scanner" },
  { href: "/predict", label: "Predict" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">
              Token<span className="text-blue-400">Scout</span>
              <span className="text-zinc-500 font-normal text-xs ml-1">2.0</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === href
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
