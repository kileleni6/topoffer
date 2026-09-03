import { useEffect, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import {
  headerTranslations,
  rtlLanguages,
  supportedLanguages,
  type HeaderLabels,
  type LanguageCode,
} from "@/lib/i18n";

const THEME_KEY = "topoffer:theme";
const LANGUAGE_KEY = "topoffer:language";

export function useLanguage() {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY) as LanguageCode | null;
    if (saved && supportedLanguages.some(([code]) => code === saved)) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = rtlLanguages.has(saved) ? "rtl" : "ltr";
    }
  }, []);

  const setLanguage = (next: LanguageCode) => {
    setLanguageState(next);
    window.localStorage.setItem(LANGUAGE_KEY, next);
    document.documentElement.lang = next;
    document.documentElement.dir = rtlLanguages.has(next) ? "rtl" : "ltr";
  };

  return { language, setLanguage, labels: headerTranslations[language] ?? headerTranslations["en"]! };
}

export function SitePreferences({
  language,
  setLanguage,
  labels,
}: {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  labels: HeaderLabels;
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = saved ? saved === "dark" : prefersDark;
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-1">
      <label className="relative flex h-9 items-center rounded-full border border-border bg-card pl-2 shadow-card">
        <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{labels.language}</span>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          className="h-full max-w-24 appearance-none bg-transparent px-2 pr-5 text-xs font-semibold outline-none"
          aria-label={labels.language}
        >
          {supportedLanguages.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground"
        aria-label={labels.theme}
        title={labels.theme}
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
