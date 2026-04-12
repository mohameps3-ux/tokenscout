"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Switch from "@radix-ui/react-switch";
import { Settings, Sun, Moon } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

export function SettingsMenu() {
  const { theme, lang, toggleTheme, setLang } = useApp();
  const t = translations[lang].settings;
  const isDark = theme === "dark";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Settings"
          className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none"
        >
          <Settings className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40 p-2 space-y-1 animate-in fade-in-0 zoom-in-95"
        >
          <p className="px-3 py-1.5 text-xs text-zinc-500 font-medium uppercase tracking-wide">
            {t.label}
          </p>

          {/* Dark mode toggle */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-2">
              {isDark
                ? <Moon className="w-4 h-4 text-zinc-400" />
                : <Sun className="w-4 h-4 text-amber-400" />}
              <span className="text-sm text-zinc-200">
                {isDark ? t.darkMode : t.lightMode}
              </span>
            </div>
            <Switch.Root
              checked={isDark}
              onCheckedChange={toggleTheme}
              className="w-9 h-5 rounded-full transition-colors bg-zinc-700 data-[state=checked]:bg-blue-600 focus:outline-none"
            >
              <Switch.Thumb className="block w-4 h-4 rounded-full bg-white shadow translate-x-0.5 transition-transform data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
          </div>

          <DropdownMenu.Separator className="h-px bg-zinc-800 my-1" />

          {/* Language selector */}
          <p className="px-3 pt-1 text-xs text-zinc-500 font-medium uppercase tracking-wide">
            {t.language}
          </p>
          {(["en", "es"] as Lang[]).map((l) => (
            <DropdownMenu.Item
              key={l}
              onSelect={() => setLang(l)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors outline-none
                ${lang === l
                  ? "bg-blue-600/20 text-blue-300"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
            >
              <span>{l === "en" ? "🇬🇧 English" : "🇪🇸 Español"}</span>
              {lang === l && <span className="text-xs text-blue-400">✓</span>}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
