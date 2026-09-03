import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDeferredValue, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  CalendarClock,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import type { DealPeriod } from "@/components/site-header";
import { OfferRow } from "@/components/offer-row";
import { Tile } from "@/components/brand";
import { Turnstile } from "@/components/turnstile";
import { useSavedCategories } from "@/hooks/use-saved-categories";
import { useMyVotes, useOffers, useToggleVote, useVisitorKey } from "@/hooks/use-offer-data";
import {
  allCategories,
  isLive,
  isUpcoming,
  rankOffers,
  slugifyCategory,
  submitOffer,
  timeLeft,
  type NewOffer,
  type RankedOffer,
} from "@/lib/offers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOPOFFER — the community-ranked deals board" },
      {
        name: "description",
        content:
          "Post offers, deals and coupon codes in any niche. Votes decide the ranking, so the best discount holds #1.",
      },
      { property: "og:title", content: "TOPOFFER — the community-ranked deals board" },
      {
        property: "og:description",
        content: "Post deals and coupon codes. Votes decide the ranking — the best offer holds #1.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): {
    category?: string | undefined;
    period?: DealPeriod | undefined;
  } => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
    period: ["today", "yesterday", "week", "month", "all"].includes(String(search["period"]))
      ? (search["period"] as DealPeriod)
      : undefined,
  }),
  component: Home,
});

/** Deals shown per page; a new page starts once the board passes this many deals. */
const PAGE_SIZE = 100;
/** Separator lines are drawn before these ranks. */
const TIER_MARKS = [11, 21, 31, 41, 51];
const HOME_CATEGORY_IDS = [
  "all", "leaderboards-attention", "seo-ai-visibility", "marketing-advertising",
  "productivity-personal-tools", "ai-agents-infrastructure", "other",
  "crypto-web3-investing", "developer-tools", "health-fitness-wellness",
];

const emptyForm = {
  title: "",
  merchant: "",
  url: "",
  discount_label: "",
  coupon_code: "",
  description: "",
  category: "",
  customCategory: "",
  expires_at: "",
  neverExpires: true,
};

const inputClass =
  "h-13 rounded-full border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40";

function isInPeriod(createdAt: string, period: DealPeriod, now = new Date()) {
  if (period === "all") return true;
  const created = new Date(createdAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "today") return created >= startOfToday;
  if (period === "yesterday") {
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    return created >= startOfYesterday && created < startOfToday;
  }
  if (period === "week") {
    const startOfWeek = new Date(startOfToday);
    const daysSinceMonday = (startOfToday.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
    return created >= startOfWeek;
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return created >= startOfMonth;
}

function Home() {
  const { category, period = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const visitorKey = useVisitorKey();
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading, error } = useOffers();
  const { data: myVotes = [] } = useMyVotes(visitorKey);
  const vote = useToggleVote(visitorKey);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"rank" | "newest" | "ending">("rank");
  const [savedOnly, setSavedOnly] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { saved } = useSavedCategories();

  const boardCategories = useMemo(() => allCategories(offers), [offers]);
  const homeCategories = useMemo(
    () => HOME_CATEGORY_IDS.flatMap((id) => {
      const match = boardCategories.find((item) => item.id === id);
      return match ? [match] : [];
    }),
    [boardCategories],
  );
  const active =
    category && boardCategories.some((c) => c.id === category) ? category : "all";
  const setActive = (id: string) => {
    setPage(1);
    navigate({ search: { category: id, period }, resetScroll: false });
  };

  const setPeriod = (nextPeriod: DealPeriod) => {
    setPage(1);
    navigate({ search: { category: active, period: nextPeriod }, resetScroll: false });
  };

  const votedIds = useMemo(() => new Set(myVotes.map((v) => v.offer_id)), [myVotes]);

  const board = useMemo(() => {
    const live = offers.filter((o) => isLive(o) && isInPeriod(o.created_at, period));
    const scoped = active === "all" ? live : live.filter((o) => o.category === active);
    const searched = scoped.filter((offer) => {
      if (savedOnly && !saved.includes(offer.category)) return false;
      if (!deferredQuery) return true;
      return [offer.title, offer.merchant, offer.description, offer.coupon_code ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery);
    });
    const ranked = rankOffers(searched);
    if (sort === "newest") {
      return [...ranked].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    if (sort === "ending") {
      return [...ranked].sort((a, b) => {
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      });
    }
    return ranked;
  }, [offers, active, period, deferredQuery, savedOnly, saved, sort]);

  const pageCount = Math.max(1, Math.ceil(board.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageOffers = board.slice(pageStart, pageStart + PAGE_SIZE);
  const podium = currentPage === 1 ? pageOffers.slice(0, 3) : [];
  const rest = currentPage === 1 ? pageOffers.slice(3) : pageOffers;

  const upcoming = useMemo(
    () =>
      offers
        .filter((o) => isUpcoming(o))
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .slice(0, 3),
    [offers],
  );

  const totalVotes = offers.reduce((sum, o) => sum + o.vote_count, 0);
  const liveCount = offers.filter((o) => isLive(o)).length;

  const onVote = (id: string) => {
    if (!visitorKey) return;
    vote.mutate(id, {
      onSuccess: (result) => toast.success(result === "added" ? "Vote counted" : "Vote removed"),
      onError: () => toast.error("Couldn't save your vote. Try again."),
    });
  };

  const renderRow = (offer: RankedOffer) => (
    <div key={offer.id}>
      {TIER_MARKS.includes(offer.rank) ? (
        <div className="flex items-center gap-3 py-4" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Top {offer.rank - 1}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : null}
      <OfferRow
        offer={offer}
        voted={votedIds.has(offer.id)}
        pending={vote.isPending}
        onVote={onVote}
        mine={!!visitorKey && offer.owner_key === visitorKey}
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("A deal needs a title and a link.");
      return;
    }
    if (!form.discount_label.trim()) {
      toast.error("Add the discount, e.g. “30% off”.");
      return;
    }
    const chosenCategory =
      form.category === "__custom"
        ? slugifyCategory(form.customCategory)
        : form.category;
    if (!chosenCategory) {
      toast.error(
        form.category === "__custom"
          ? "Name your niche, e.g. “3D printing”."
          : "Pick a category for your deal.",
      );
      return;
    }
    if (!form.neverExpires && !form.expires_at) {
      toast.error("Add an expiry date or mark the deal as never expiring.");
      return;
    }
    const url = form.url.trim().startsWith("http") ? form.url.trim() : `https://${form.url.trim()}`;
    let merchant = form.merchant.trim();
    if (!merchant) {
      try {
        merchant = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        toast.error("That link doesn't look valid.");
        return;
      }
    }
    const payload: NewOffer = {
      title: form.title.trim(),
      merchant,
      url,
      coupon_code: form.coupon_code.trim() ? form.coupon_code.trim().toUpperCase() : null,
      discount_label: form.discount_label.trim(),
      description: form.description.trim() || "Submitted by a member of the community.",
      category: chosenCategory,
      starts_at: new Date().toISOString(),
      expires_at:
        !form.neverExpires && form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    setSaving(true);
    try {
      await submitOffer(payload, visitorKey, captchaToken);
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      setForm(emptyForm);
      setCaptchaToken("");
      setFormOpen(false);
      setActive(chosenCategory);
      toast.success("Deal published", {
        description: "It's live on the board — votes decide how high it climbs.",
      });
    } catch {
      toast.error("Couldn't publish that deal. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader scope="board" period={period} onPeriodChange={setPeriod} />

      <main id="main-content" className="mx-auto w-full max-w-6xl px-5">
        <section className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]" aria-label="Search and filters">
          <label className="flex h-11 items-center gap-3 rounded-full border border-border bg-card px-4 shadow-card focus-within:ring-2 focus-within:ring-ring/40">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Search deals, coupon codes, or merchants</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search deals, codes, or merchants"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as typeof sort);
              setPage(1);
            }}
            className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold shadow-card outline-none"
            aria-label="Sort deals"
          >
            <option value="rank">Top ranked</option>
            <option value="newest">Newest</option>
            <option value="ending">Ending soon</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSavedOnly((value) => !value);
              setPage(1);
            }}
            aria-pressed={savedOnly}
            className={`flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-card ${
              savedOnly ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            <Star className={`h-4 w-4 ${savedOnly ? "fill-current" : ""}`} /> Saved
          </button>
        </section>

        <nav
          className="mb-10 flex items-center gap-1 overflow-x-auto rounded-full bg-secondary/70 p-1.5 shadow-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Deal categories"
        >
          {homeCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              aria-current={active === c.id ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active === c.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
          <Link
            to="/categories"
            className="ml-auto flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-card"
          >
            More <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </nav>

        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-live live-dot" />
            <span className="font-semibold text-foreground">{liveCount} live deals</span>
            <span aria-hidden="true">·</span>
            <span>{totalVotes.toLocaleString("en-US")} votes cast</span>
          </div>
        </div>

        <h1 className="mt-8 text-center text-4xl font-bold tracking-tight sm:text-5xl">
          The best offer wins <span className="text-primary">#1</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-muted-foreground">
          Post an offer, deal or coupon code in any niche. Every vote moves it up the board — no
          bidding, no paid placement, no account needed.
        </p>

        <div className="mt-8">
          {formOpen ? (
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Deal title — e.g. “Acme Pro — 40% off annual”"
                className={`${inputClass} sm:col-span-2`}
              />
              <div className="relative">
                <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="Link to the offer"
                  className={`${inputClass} w-full pl-11 pr-4`}
                />
              </div>
              <input
                value={form.discount_label}
                onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
                placeholder="Discount — 30% off, BOGO, free trial…"
                className={inputClass}
              />
              <input
                value={form.coupon_code}
                onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
                placeholder="Coupon code (optional)"
                className={`${inputClass} uppercase placeholder:normal-case`}
              />
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-13 w-full appearance-none rounded-full border border-border bg-card pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {boardCategories
                    .filter((c) => c.id !== "all")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  <option value="__custom">+ My own niche…</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {form.category === "__custom" ? (
                <input
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  placeholder="Name your niche — e.g. “3D printing”"
                  className={`${inputClass} sm:col-start-2`}
                />
              ) : null}
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="One line on what you get"
                className={inputClass}
              />
              <div className="flex flex-col gap-2">
                <label className="flex h-13 items-center gap-3 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground">
                  Expires
                  <input
                    type="date"
                    disabled={form.neverExpires}
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="flex-1 bg-transparent text-foreground outline-none disabled:opacity-40"
                  />
                </label>
                <label className="flex items-center gap-2 px-4 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.neverExpires}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        neverExpires: e.target.checked,
                        expires_at: e.target.checked ? "" : form.expires_at,
                      })
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Never expires
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
                <Turnstile onToken={setCaptchaToken} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
                <button
                  disabled={saving || (!!import.meta.env["VITE_TURNSTILE_SITE_KEY"] && !captchaToken)}
                  className="h-13 flex-1 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {saving ? "Publishing…" : "Publish deal"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setForm(emptyForm);
                  }}
                  className="flex h-13 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-6 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Post this deal
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-6 rounded-xl bg-surface p-6 text-center text-sm text-muted-foreground">
            Couldn't load the board. Refresh to try again.
          </p>
        ) : null}

        {podium.length > 0 ? (
          <section className="mt-6 space-y-2" aria-label="Podium">
            {podium.map(renderRow)}
          </section>
        ) : null}

        {isLoading ? (
          <section className="mt-6 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
            ))}
          </section>
        ) : null}

        {upcoming.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <CalendarClock className="h-4 w-4 text-primary" />
                Starting soon
              </h2>
              <Link to="/today" className="text-sm text-muted-foreground hover:text-foreground">
                My dashboard
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {upcoming.map((o) => (
                <div
                  key={o.id}
                  className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <Tile initials={o.initials} tint={o.tint} size="sm" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{o.title}</h3>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{o.description}</p>
                    <p className="mt-1 text-sm font-bold text-primary">{o.discount_label}</p>
                    <p className="text-xs text-muted-foreground">
                      opens {new Date(o.starts_at).toLocaleDateString()} · {timeLeft(o.expires_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 space-y-2">
          {rest.map(renderRow)}
          {!isLoading && board.length === 0 ? (
            <p className="rounded-xl bg-surface p-8 text-center text-sm text-muted-foreground">
              No live deals in this category yet — post one and it starts at #1.
            </p>
          ) : null}
        </section>

        {pageCount > 1 ? (
          <nav
            className="mt-8 flex items-center justify-center gap-2"
            aria-label="Board pagination"
          >
            <button
              onClick={() => setPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                aria-current={n === currentPage ? "page" : undefined}
                className={`h-9 w-9 rounded-full text-sm font-bold transition-colors ${
                  n === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(currentPage + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
