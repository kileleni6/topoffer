import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { useOffers } from "@/hooks/use-offer-data";
import { categories, isLive, rankOffers } from "@/lib/offers";
import { useSavedCategories } from "@/hooks/use-saved-categories";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Deal categories — TOPOFFER" },
      {
        name: "description",
        content:
          "Browse every deal board: software, marketing, finance, retail, travel, health, gaming and business offers.",
      },
      { property: "og:title", content: "Deal categories — TOPOFFER" },
      {
        property: "og:description",
        content: "Software, marketing, finance, retail, travel, health, gaming and business deals.",
      },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data: offers = [], isLoading } = useOffers();
  const [query, setQuery] = useState("");
  const { isSaved, toggle } = useSavedCategories();
  const boards = categories.filter(
    (category) =>
      category.id !== "all" && category.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const live = useMemo(() => rankOffers(offers.filter((o) => isLive(o))), [offers]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-5xl px-5">
        <h1 className="text-4xl font-bold tracking-tight">Every deal board</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Each category keeps its own ranking, so a niche coupon can still hold #1 somewhere.
        </p>

        <label className="mt-6 flex max-w-lg items-center gap-3 rounded-full border border-border bg-card px-4 shadow-card focus-within:ring-2 focus-within:ring-ring/40">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Search categories</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories"
            className="h-11 flex-1 bg-transparent text-sm outline-none"
          />
        </label>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((c) => {
            const inBoard = live.filter((o) => o.category === c.id);
            const top = inBoard[0];
            return (
              <article
                key={c.id}
                className="relative rounded-2xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link to="/" search={{ category: c.id, period: "all" }} className="after:absolute after:inset-0">
                    <h2 className="text-base font-bold">{c.label}</h2>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    className="relative z-10 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                    aria-label={`${isSaved(c.id) ? "Remove" : "Save"} ${c.label}`}
                    aria-pressed={isSaved(c.id)}
                  >
                    <Star className={`h-4 w-4 ${isSaved(c.id) ? "fill-current text-primary" : ""}`} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isLoading ? "loading…" : `${inBoard.length} live ${inBoard.length === 1 ? "deal" : "deals"}`}
                </p>
                <p className="mt-4 text-sm font-semibold text-primary">
                  {top ? `#1 needs ${top.vote_count + 1} votes` : "#1 is open"}
                </p>
                {top ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    top: {top.discount_label} at {top.merchant}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">no deals posted yet</p>
                )}
              </article>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
