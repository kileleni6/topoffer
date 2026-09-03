import { supabase } from "@/integrations/supabase/client";

export type Category = { id: string; label: string };

export const categories: Category[] = [
  { id: "all", label: "All" },
  { id: "ai-agents-infrastructure", label: "AI Agents & Infrastructure" },
  { id: "seo-ai-visibility", label: "SEO & AI Visibility" },
  { id: "marketing-advertising", label: "Marketing & Advertising" },
  { id: "crypto-web3-investing", label: "Crypto, Web3 & Investing" },
  { id: "developer-tools", label: "Developer Tools" },
  { id: "business-finance-legal", label: "Business, Finance & Legal" },
  { id: "security-privacy-compliance", label: "Security, Privacy & Compliance" },
  { id: "health-fitness-wellness", label: "Health, Fitness & Wellness" },
  { id: "social-creator-tools", label: "Social Media & Creator Tools" },
  { id: "leaderboards-attention", label: "Leaderboards & Attention Markets" },
  { id: "hiring-jobs-careers", label: "Hiring, Jobs & Careers" },
  { id: "education-learning", label: "Education & Learning" },
  { id: "agencies-studios-services", label: "Agencies, Studios & Services" },
  { id: "ecommerce-retail", label: "Ecommerce & Retail" },
  { id: "domains-web-assets", label: "Domains & Web Assets" },
  { id: "games-entertainment", label: "Games & Entertainment" },
  { id: "people-profiles", label: "People & Profiles" },
  { id: "productivity-personal-tools", label: "Productivity & Personal Tools" },
  { id: "design-creative", label: "Design & Creative" },
  { id: "writing-content", label: "Writing & Content" },
  { id: "directories-launch-discovery", label: "Directories, Launch & Discovery" },
  { id: "ai-media-generation", label: "AI Media Generation" },
  { id: "audio-voice-podcasting", label: "Audio, Voice & Podcasting" },
  { id: "sales-lead-generation", label: "Sales & Lead Generation" },
  { id: "travel-local-lifestyle", label: "Travel, Local & Lifestyle" },
  { id: "real-estate-property", label: "Real Estate & Property" },
  { id: "media-news", label: "Media & News" },
  { id: "software", label: "Software" },
  { id: "ai-tools", label: "AI tools" },
  { id: "saas", label: "SaaS" },
  { id: "hosting", label: "Hosting & domains" },
  { id: "marketing", label: "Marketing" },
  { id: "seo", label: "SEO" },
  { id: "design", label: "Design" },
  { id: "courses", label: "Courses & education" },
  { id: "finance", label: "Finance" },
  { id: "crypto", label: "Crypto" },
  { id: "retail", label: "Retail" },
  { id: "fashion", label: "Fashion" },
  { id: "electronics", label: "Electronics" },
  { id: "home", label: "Home & garden" },
  { id: "food", label: "Food & drink" },
  { id: "travel", label: "Travel" },
  { id: "health", label: "Health & fitness" },
  { id: "beauty", label: "Beauty" },
  { id: "pets", label: "Pets" },
  { id: "kids", label: "Kids & baby" },
  { id: "sports", label: "Sports & outdoors" },
  { id: "auto", label: "Automotive" },
  { id: "gaming", label: "Gaming" },
  { id: "entertainment", label: "Entertainment" },
  { id: "mobile", label: "Mobile & telecom" },
  { id: "business", label: "Business" },
  { id: "freelance", label: "Freelance & jobs" },
  { id: "events", label: "Events & tickets" },
  { id: "other", label: "Other" },
];

/** Turns any free-text niche into a stable category id. */
export function slugifyCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const titleCase = (id: string) =>
  id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const categoryLabel = (id: string) =>
  categories.find((c) => c.id === id)?.label ?? titleCase(id);

/** Built-in categories plus any custom niche already used by a posted deal. */
export function allCategories(offers: { category: string }[]): Category[] {
  const known = new Set(categories.map((c) => c.id));
  const extra: Category[] = [];
  for (const o of offers) {
    if (!o.category || known.has(o.category)) continue;
    known.add(o.category);
    extra.push({ id: o.category, label: categoryLabel(o.category) });
  }
  extra.sort((a, b) => a.label.localeCompare(b.label));
  return [...categories, ...extra];
}


export type Offer = {
  id: string;
  title: string;
  merchant: string;
  url: string;
  coupon_code: string | null;
  discount_label: string;
  description: string;
  category: string;
  starts_at: string;
  expires_at: string | null;
  vote_count: number;
  clicks: number;
  tint: string;
  initials: string;
  owner_key: string | null;
  created_at: string;
};

export type RankedOffer = Offer & { rank: number };

export type Vote = { id: string; offer_id: string; voter_key: string; created_at: string };

export type RankTarget = {
  id: string;
  offer_id: string;
  owner_key: string;
  target_rank: number;
  created_at: string;
};

export const DAILY_VOTE_CREDITS = 10;

const VISITOR_STORAGE_KEY = "topoffer:visitor";

/** Browser-only. Returns a stable anonymous UUID for this visitor. */
export function readVisitorKey(): string {
  if (typeof window === "undefined") return "";
  let key = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, key);
  }
  return key;
}

const TINTS = [
  "oklch(0.62 0.17 275)",
  "oklch(0.6 0.14 175)",
  "oklch(0.58 0.2 300)",
  "oklch(0.72 0.17 60)",
  "oklch(0.65 0.16 20)",
  "oklch(0.5 0.12 200)",
  "oklch(0.7 0.16 330)",
  "oklch(0.62 0.15 145)",
];

export function tintFor(seed: string) {
  let n = 0;
  for (const ch of seed) n = (n + ch.charCodeAt(0)) % 9973;
  return TINTS[n % TINTS.length] as string;
}

export function initialsFor(value: string) {
  const parts = value
    .replace(/https?:\/\//, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  const letters = (parts[0]?.[0] ?? "O") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "F");
  return letters.toUpperCase();
}

export const isLive = (o: Offer, now = Date.now()) =>
  new Date(o.starts_at).getTime() <= now && !isExpired(o, now);

export const isUpcoming = (o: Offer, now = Date.now()) =>
  new Date(o.starts_at).getTime() > now;

export const isExpired = (o: Offer, now = Date.now()) =>
  o.expires_at != null && new Date(o.expires_at).getTime() < now;

/** Votes decide rank; ties break on who posted first. */
export function rankOffers(offers: Offer[]): RankedOffer[] {
  return [...offers]
    .sort(
      (a, b) =>
        b.vote_count - a.vote_count ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((o, i) => ({ ...o, rank: i + 1 }));
}

export function timeLeft(iso: string | null) {
  if (!iso) return "no end date";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${Math.max(hours, 1)}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const dayStart = (iso: string) => new Date(iso).toISOString().slice(0, 10);

// ——— data access ———

export async function fetchOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Offer[];
}

export async function fetchMyVotes(voterKey: string): Promise<Vote[]> {
  if (!voterKey) return [];
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("voter_key", voterKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vote[];
}

export async function fetchMyTargets(ownerKey: string): Promise<RankTarget[]> {
  if (!ownerKey) return [];
  const { data, error } = await supabase
    .from("rank_targets")
    .select("*")
    .eq("owner_key", ownerKey);
  if (error) throw error;
  return (data ?? []) as RankTarget[];
}

export async function toggleVote(offerId: string, voterKey: string): Promise<"added" | "removed"> {
  return secureAction<"added" | "removed">({
    action: "toggle_vote",
    offerId,
    visitorKey: voterKey,
  });
}

export type NewOffer = {
  title: string;
  merchant: string;
  url: string;
  coupon_code: string | null;
  discount_label: string;
  description: string;
  category: string;
  starts_at: string;
  expires_at: string | null;
};

export async function submitOffer(
  offer: NewOffer,
  ownerKey: string,
  captchaToken?: string,
): Promise<Offer> {
  return secureAction<Offer>({
    action: "submit_offer",
    visitorKey: ownerKey,
    captchaToken,
    offer: {
      ...offer,
      tint: tintFor(offer.merchant + offer.title),
      initials: initialsFor(offer.merchant || offer.title),
    },
  });
}

export async function saveTarget(offerId: string, ownerKey: string, targetRank: number) {
  await secureAction({
    action: "save_target",
    offerId,
    visitorKey: ownerKey,
    targetRank,
  });
}

export async function removeTarget(offerId: string, ownerKey: string) {
  await secureAction({ action: "remove_target", offerId, visitorKey: ownerKey });
}

export async function registerClick(offer: Offer) {
  await secureAction({
    action: "register_click",
    offerId: offer.id,
    visitorKey: readVisitorKey(),
  });
}

async function secureAction<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("secure-action", { body });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data?.data as T;
}
