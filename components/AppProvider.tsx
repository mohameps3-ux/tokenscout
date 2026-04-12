"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Lang } from "@/lib/i18n";

type Theme = "dark" | "light";

interface AppContextValue {
  theme: Theme;
  lang: Lang;
  toggleTheme: () => void;
  setLang: (l: Lang) => void;
}

const AppContext = createContext<AppContextValue>({
  theme: "dark",
  lang: "en",
  toggleTheme: () => {},
  setLang: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted preferences
    const savedTheme = (localStorage.getItem("ts-theme") as Theme) ?? "dark";
    const savedLang  = (localStorage.getItem("ts-lang")  as Lang)  ?? "en";
    setTheme(savedTheme);
    setLangState(savedLang);
    applyTheme(savedTheme);
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("ts-theme", next);
      applyTheme(next);
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("ts-lang", l);
  }, []);

  // Avoid flash of wrong theme on first render
  if (!mounted) return <>{children}</>;

  return (
    <AppContext.Provider value={{ theme, lang, toggleTheme, setLang }}>
      {children}
    </AppContext.Provider>
  );
}
