import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { DAILY_VOTE_CREDITS } from "@/lib/offers";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How TOPOFFER works — votes decide the deal board" },
      {
        name: "description",
        content:
          "Post an offer, deal or coupon code. Votes decide the ranking, expiry dates clear the board, no paid placement.",
      },
      { property: "og:title", content: "How TOPOFFER works" },
      {
        property: "og:description",
        content: "Post a deal, collect votes, hold the podium. No bidding, no paid placement.",
      },
    ],
  }),
  component: About,
});

const steps = [
  {
    title: "Post the offer",
    body: "Title, link, the discount and the coupon code if there is one. It goes live the moment you submit.",
  },
  {
    title: "Collect votes",
    body: `Every visitor gets ${DAILY_VOTE_CREDITS} vote credits a day. The deal with the most votes holds #1 — ties go to whoever posted first.`,
  },
  {
    title: "Watch the clock",
    body: "Deals drop off the board when they expire, and scheduled offers appear under “starting soon” until they open.",
  },
  {
    title: "Chase a rank",
    body: "Set a target rank on your own deal and the ranking page tells you exactly how many votes stand between you and that spot.",
  },
];

function About() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5">
        <h1 className="text-4xl font-bold tracking-tight">Votes, not bids</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          TOPOFFER is a board for offers, deals and coupon codes. Nobody can pay for placement —
          the community decides which discount deserves the top spot. No account needed either: your
          browser holds an anonymous key that owns your posts, votes and goals.
        </p>

        <div className="mt-10 space-y-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
                {i + 1}
              </span>
              <div>
                <h2 className="font-bold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-podium p-6 text-center">
          <p className="text-sm text-accent-foreground">
            Clearing your browser data resets your anonymous key, so keep the same browser to keep
            your dashboard.
          </p>
          <Link
            to="/"
            search={{ category: "all" }}
            className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
          >
            Post a deal
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
