export type Lang = "en" | "es";

export const translations = {
  en: {
    nav: {
      scanner: "Scanner",
      predict: "Predict",
      dashboard: "Dashboard",
      pricing: "Pricing",
    },
    settings: {
      label: "Settings",
      darkMode: "Dark mode",
      lightMode: "Light mode",
      language: "Language",
    },
  },
  es: {
    nav: {
      scanner: "Escáner",
      predict: "Predecir",
      dashboard: "Panel",
      pricing: "Precios",
    },
    settings: {
      label: "Ajustes",
      darkMode: "Modo oscuro",
      lightMode: "Modo claro",
      language: "Idioma",
    },
  },
} as const;

export type Translations = typeof translations.en;
