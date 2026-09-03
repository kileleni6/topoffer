export const supportedLanguages = [
  ["en", "English"], ["sw", "Kiswahili"], ["fr", "Français"], ["es", "Español"],
  ["de", "Deutsch"], ["pt", "Português"], ["it", "Italiano"], ["nl", "Nederlands"],
  ["pl", "Polski"], ["cs", "Čeština"], ["sk", "Slovenčina"], ["hu", "Magyar"],
  ["ro", "Română"], ["bg", "Български"], ["el", "Ελληνικά"], ["ru", "Русский"],
  ["uk", "Українська"], ["tr", "Türkçe"], ["ar", "العربية"], ["he", "עברית"],
  ["fa", "فارسی"], ["hi", "हिन्दी"], ["bn", "বাংলা"], ["ur", "اردو"],
  ["ta", "தமிழ்"], ["te", "తెలుగు"], ["mr", "मराठी"], ["gu", "ગુજરાતી"],
  ["pa", "ਪੰਜਾਬੀ"], ["ne", "नेपाली"], ["si", "සිංහල"], ["zh", "中文"],
  ["ja", "日本語"], ["ko", "한국어"], ["vi", "Tiếng Việt"], ["th", "ไทย"],
  ["id", "Bahasa Indonesia"], ["ms", "Bahasa Melayu"], ["tl", "Filipino"],
  ["my", "မြန်မာ"], ["km", "ខ្មែរ"], ["lo", "ລາວ"], ["da", "Dansk"],
  ["sv", "Svenska"], ["no", "Norsk"], ["fi", "Suomi"], ["is", "Íslenska"],
  ["et", "Eesti"], ["lv", "Latviešu"], ["lt", "Lietuvių"], ["hr", "Hrvatski"],
  ["sr", "Српски"], ["sl", "Slovenščina"], ["sq", "Shqip"], ["am", "አማርኛ"],
  ["zu", "isiZulu"], ["af", "Afrikaans"], ["so", "Soomaali"], ["ha", "Hausa"],
] as const;

export type LanguageCode = (typeof supportedLanguages)[number][0];

export type HeaderLabels = {
  deals: string;
  dashboard: string;
  ranking: string;
  categories: string;
  about: string;
  theme: string;
  language: string;
};

export const headerTranslations: Record<string, HeaderLabels> = {
  en: { deals: "Deals", dashboard: "Dashboard", ranking: "Ranking", categories: "Categories", about: "About", theme: "Toggle dark mode", language: "Language" },
  sw: { deals: "Ofa", dashboard: "Dashibodi", ranking: "Nafasi", categories: "Makundi", about: "Kuhusu", theme: "Badili hali ya giza", language: "Lugha" },
  fr: { deals: "Offres", dashboard: "Tableau", ranking: "Classement", categories: "Catégories", about: "À propos", theme: "Mode sombre", language: "Langue" },
  es: { deals: "Ofertas", dashboard: "Panel", ranking: "Clasificación", categories: "Categorías", about: "Acerca de", theme: "Modo oscuro", language: "Idioma" },
  de: { deals: "Angebote", dashboard: "Übersicht", ranking: "Rangliste", categories: "Kategorien", about: "Über uns", theme: "Dunkelmodus", language: "Sprache" },
  pt: { deals: "Ofertas", dashboard: "Painel", ranking: "Ranking", categories: "Categorias", about: "Sobre", theme: "Modo escuro", language: "Idioma" },
  ar: { deals: "العروض", dashboard: "لوحة التحكم", ranking: "الترتيب", categories: "الفئات", about: "حول", theme: "الوضع الداكن", language: "اللغة" },
  hi: { deals: "ऑफ़र", dashboard: "डैशबोर्ड", ranking: "रैंकिंग", categories: "श्रेणियाँ", about: "परिचय", theme: "डार्क मोड", language: "भाषा" },
  zh: { deals: "优惠", dashboard: "面板", ranking: "排名", categories: "分类", about: "关于", theme: "深色模式", language: "语言" },
  ja: { deals: "オファー", dashboard: "ダッシュボード", ranking: "ランキング", categories: "カテゴリー", about: "概要", theme: "ダークモード", language: "言語" },
  ru: { deals: "Предложения", dashboard: "Панель", ranking: "Рейтинг", categories: "Категории", about: "О нас", theme: "Тёмная тема", language: "Язык" },
};

export const rtlLanguages = new Set(["ar", "he", "fa", "ur"]);
