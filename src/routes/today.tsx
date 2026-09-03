import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { CalendarClock, ChevronUp, MousePointerClick, Tag, Target, Wallet } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Tile } from "@/components/brand";
import { useMyTargets, useMyVotes, useOffers, useVisitorKey } from "@/hooks/use-offer-data";
import {
  DAILY_VOTE_CREDITS,
  categoryLabel,
  isExpired,
  isLive,
  isUpcoming,
  rankOffers,
  timeAgo,
  timeLeft,
} from "@/lib/offers";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "My dashboard — TOPOFFER" },
      {
        name: "description",
        content:
          "Track the deals you posted, the votes you've cast, your daily vote credits and your upcoming offers.",
      },
      { property: "og:title", content: "My dashboard — TOPOFFER" },
      {
        property: "og:description",
        content: "Your posted deals, vote history, daily vote credits and upcoming offers.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const visitorKey = useVisitorKey();
  const { data: offers = [], isLoading } = useOffers();
  const { data: myVotes = [] } = useMyVotes(visitorKey);
  const { data: myTargets = [] } = useMyTargets(visitorKey);

  const board = useMemo(() => rankOffers(offers.filter((o) => isLive(o))), [offers]);
  const rankOf = useMemo(
    () => new Map(board.map((o) => [o.id, o.rank])),
    [board],
  );

  const mine = useMemo(
    () => offers.filter((o) => visitorKey !== "" && o.owner_key === visitorKey),
    [offers, visitorKey],
  );
  const myLive = mine.filter((o) => isLive(o));
  const myUpcoming = mine.filter((o) => isUpcoming(o));
  const myExpired = mine.filter((o) => isExpired(o));

  const votesToday = myVotes.filter(
    (v) => new Date(v.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const creditsLeft = Math.max(DAILY_VOTE_CREDITS - votesToday, 0);

  const votesReceived = mine.reduce((sum, o) => sum + o.vote_count, 0);
  const clicksReceived = mine.reduce((sum, o) => sum + o.clicks, 0);
  const bestRank = myLive.reduce<number | null>((best, o) => {
    const r = rankOf.get(o.id);
    if (!r) return best;
    return best === null || r < best ? r : best;
  }, null);

  const offerById = useMemo(() => new Map(offers.map((o) => [o.id, o])), [offers]);

  return (
    <div className="min-h-screen">
      <SiteHeader scope="dashboard" />
      <main className="mx-auto w-full max-w-5xl px-5">
        <h1 className="text-4xl font-bold tracking-tight">My dashboard</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          No account needed — this device is your identity. Everything you post or vote on is tied
          to a private key stored in your browser.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Wallet className="h-4 w-4" />}
            label="Vote credits left today"
            value={`${creditsLeft} / ${DAILY_VOTE_CREDITS}`}
            note={`${votesToday} used today`}
          />
          <Stat
            icon={<ChevronUp className="h-4 w-4" />}
            label="Votes on my deals"
            value={votesReceived.toLocaleString("en-US")}
            note={`${mine.length} posted`}
          />
          <Stat
            icon={<MousePointerClick className="h-4 w-4" />}
            label="Clicks earned"
            value={clicksReceived.toLocaleString("en-US")}
            note={`${myLive.length} live now`}
          />
          <Stat
            icon={<Target className="h-4 w-4" />}
            label="Best live rank"
            value={bestRank ? `#${bestRank}` : "—"}
            note={`${myTargets.length} goal${myTargets.length === 1 ? "" : "s"} set`}
          />
        </div>

        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">My deals</h2>
            <Link to="/ranking" className="text-sm text-muted-foreground hover:text-foreground">
              Set rank goals
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {isLoading ? (
              <div className="h-20 animate-pulse rounded-xl bg-surface" />
            ) : myLive.length === 0 && myUpcoming.length === 0 && myExpired.length === 0 ? (
              <p className="rounded-xl bg-surface p-8 text-center text-sm text-muted-foreground">
                You haven't posted a deal yet.{" "}
                <Link
                  to="/"
                  search={{ category: "all" }}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Post your first offer
                </Link>
                .
              </p>
            ) : (
              [...myLive, ...myUpcoming, ...myExpired].map((o) => {
                const rank = rankOf.get(o.id);
                const target = myTargets.find((t) => t.offer_id === o.id);
                return (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card"
                  >
                    <span className="w-11 text-center text-sm font-bold text-muted-foreground">
                      {rank ? `#${rank}` : isUpcoming(o) ? "soon" : "ended"}
                    </span>
                    <Tile initials={o.initials} tint={o.tint} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabel(o.category)} · {o.discount_label} · {timeLeft(o.expires_at)}
                        {o.coupon_code ? ` · code ${o.coupon_code}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{o.clicks} clicks</span>
                    <span className="text-sm font-bold text-primary">{o.vote_count} votes</span>
                    {target ? (
                      <span className="rounded-full bg-podium px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        goal #{target.target_rank}
                      </span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Upcoming listings
          </h2>
          <div className="mt-3 space-y-2">
            {offers.filter((o) => isUpcoming(o)).length === 0 ? (
              <p className="rounded-xl bg-surface p-6 text-center text-sm text-muted-foreground">
                Nothing scheduled ahead right now.
              </p>
            ) : (
              offers
                .filter((o) => isUpcoming(o))
                .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                .map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3"
                  >
                    <Tile initials={o.initials} tint={o.tint} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.title}</p>
                      <p className="text-xs text-muted-foreground">
                        opens {new Date(o.starts_at).toLocaleString()} · {o.discount_label}
                      </p>
                    </div>
                    {o.owner_key === visitorKey && visitorKey ? (
                      <span className="text-xs font-semibold text-primary">yours</span>
                    ) : null}
                  </div>
                ))
            )}
          </div>
        </section>

        <section className="mt-12 pb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Tag className="h-4 w-4 text-primary" />
            My vote history
          </h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {myVotes.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                You haven't voted yet — every vote moves a deal up the board.
              </p>
            ) : (
              myVotes.map((v) => {
                const o = offerById.get(v.offer_id);
                if (!o) return null;
                const rank = rankOf.get(o.id);
                return (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                    <Tile initials={o.initials} tint={o.tint} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{o.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {rank ? `now #${rank}` : "off board"}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(v.created_at)}</span>
                    <button
                      onClick={() => toast.info("Manage this vote from the board's vote button.")}
                      className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      view
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
