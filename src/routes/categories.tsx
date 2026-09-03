import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { useOffers } from "@/hooks/use-offer-data";
import { categories, isLive, rankOffers } from "@/lib/offers";

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
  const boards = categories.filter((c) => c.id !== "all");

  const live = useMemo(() => rankOffers(offers.filter((o) => isLive(o))), [offers]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5">
        <h1 className="text-4xl font-bold tracking-tight">Every deal board</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Each category keeps its own ranking, so a niche coupon can still hold #1 somewhere.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((c) => {
            const inBoard = live.filter((o) => o.category === c.id);
            const top = inBoard[0];
            return (
              <Link
                key={c.id}
                to="/"
                search={{ category: c.id }}
                className="rounded-2xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <h2 className="text-base font-bold">{c.label}</h2>
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
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
