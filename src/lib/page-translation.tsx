import { useEffect } from "react";
import catalogs from "./translations.generated.json";
import { rtlLanguages, supportedLanguages, type LanguageCode } from "./i18n";

const LANGUAGE_KEY = "topoffer:language";
const sourceText = new WeakMap<Node, string>();
const sourceAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ["placeholder", "aria-label", "title"] as const;

type Catalogs = Record<string, Record<string, string>>;

function currentLanguage(): LanguageCode {
  const saved = window.localStorage.getItem(LANGUAGE_KEY) as LanguageCode | null;
  return saved && supportedLanguages.some(([code]) => code === saved) ? saved : "en";
}

function translateValue(value: string, language: LanguageCode) {
  if (language === "en") return value;
  const translated = (catalogs as Catalogs)[language]?.[value.trim()];
  if (!translated) return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function translateTree(root: ParentNode, language: LanguageCode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (
      !node.textContent?.trim() ||
      node.parentElement?.closest("script,style,[data-no-translate]") ||
      node.parentElement?.closest("[data-user-content]")
    )
      continue;
    const original = sourceText.get(node) ?? node.textContent;
    sourceText.set(node, original);
    const next = translateValue(original, language);
    if (node.textContent !== next) node.textContent = next;
  }

  for (const element of root.querySelectorAll<HTMLElement>("[placeholder],[aria-label],[title]")) {
    let originals = sourceAttributes.get(element);
    if (!originals) {
      originals = new Map();
      sourceAttributes.set(element, originals);
    }
    for (const attribute of translatedAttributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const original = originals.get(attribute) ?? value;
      originals.set(attribute, original);
      element.setAttribute(attribute, translateValue(original, language));
    }
  }
}

export function PageTranslation() {
  useEffect(() => {
    let language = currentLanguage();
    let translating = false;
    let scheduled = false;

    const apply = () => {
      translating = true;
      document.documentElement.lang = language;
      document.documentElement.dir = rtlLanguages.has(language) ? "rtl" : "ltr";
      translateTree(document.body, language);
      translating = false;
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        apply();
      });
    };

    const observer = new MutationObserver(() => {
      if (!translating) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onLanguage = (event: Event) => {
      language = (event as CustomEvent<LanguageCode>).detail;
      apply();
    };
    window.addEventListener("topoffer:language", onLanguage);
    apply();
    return () => {
      observer.disconnect();
      window.removeEventListener("topoffer:language", onLanguage);
    };
  }, []);

  return null;
}
