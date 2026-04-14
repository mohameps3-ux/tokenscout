"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Zap, Moon, Sun } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { SettingsMenu } from "@/components/SettingsMenu";
import { useApp } from "@/components/AppProvider";
import { translations } from "@/lib/i18n";

export function Navbar() {
  const pathname = usePathname();
  const { lang, theme, toggleTheme, setLang } = useApp();
  const t = translations[lang].nav;

  const NAV = [
    { href: "/", label: t.markets },
    { href: "/scanner", label: t.scanner },
    { href: "/predict", label: t.predict },
    { href: "/dashboard", label: t.dashboard },
    { href: "/whales", label: t.whales },
    { href: "/referral", label: t.referral },
    { href: "/alerts", label: t.alerts },
    { href: "/pricing", label: t.pricing },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white hidden sm:inline">
              Token<span className="text-blue-400">Scout</span>
              <span className="text-zinc-500 font-normal text-xs ml-1">2.0</span>
            </span>
          </Link>

          {/* Search — grows to fill available space */}
          <div className="flex-1 max-w-sm">
            <SearchBar />
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
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

          {/* Live indicator + Theme toggle + Language toggle + Settings */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live
            </span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              aria-label="Toggle language"
              className="flex items-center justify-center h-8 px-2 rounded-md text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors tabular-nums"
            >
              {lang === "en" ? "ES" : "EN"}
            </button>
            <SettingsMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
