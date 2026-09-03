import { useEffect, useState } from "react";

const STORAGE_KEY = "topoffer:saved-categories";

export function useSavedCategories() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(value)) setSaved(value.filter((item): item is string => typeof item === "string"));
    } catch {
      setSaved([]);
    }
  }, []);

  const toggle = (category: string) => {
    setSaved((current) => {
      const next = current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { saved, toggle, isSaved: (category: string) => saved.includes(category) };
}
