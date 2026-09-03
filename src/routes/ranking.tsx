import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronUp, Target, Trophy } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Tile } from "@/components/brand";
import { useMyTargets, useOffers, useVisitorKey } from "@/hooks/use-offer-data";
import {
  categoryLabel,
  isLive,
  rankOffers,
  removeTarget,
  saveTarget,
  type RankedOffer,
} from "@/lib/offers";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Rank goals — TOPOFFER" },
      {
        name: "description",
        content:
          "Pick a target rank for each deal you posted and track exactly how many votes it needs to get there.",
      },
      { property: "og:title", content: "Rank goals — TOPOFFER" },
      {
        property: "og:description",
        content: "Set a target rank for your deals and track the votes needed to reach the podium.",
      },
    ],
  }),
  component: Ranking,
});

function Ranking() {
  const visitorKey = useVisitorKey();
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading } = useOffers();
  const { data: myTargets = [] } = useMyTargets(visitorKey);
  const [busy, setBusy] = useState<string | null>(null);

  const board = useMemo(() => rankOffers(offers.filter((o) => isLive(o))), [offers]);
  const mine = useMemo(
    () => board.filter((o) => visitorKey !== "" && o.owner_key === visitorKey),
    [board, visitorKey],
  );
  const podium = board.slice(0, 3);

  const votesNeeded = (offer: RankedOffer, target: number) => {
    if (target >= offer.rank) return 0;
    const holder = board[target - 1];
    if (!holder) return 0;
    return Math.max(holder.vote_count - offer.vote_count + 1, 0);
  };

  const commit = async (offerId: string, target: number) => {
    setBusy(offerId);
    try {
      await saveTarget(offerId, visitorKey, target);
      await queryClient.invalidateQueries({ queryKey: ["targets", visitorKey] });
      toast.success(`Goal set: reach #${target}`);
    } catch {
      toast.error("Couldn't save that goal. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const clear = async (offerId: string) => {
    setBusy(offerId);
    try {
      await removeTarget(offerId, visitorKey);
      await queryClient.invalidateQueries({ queryKey: ["targets", visitorKey] });
      toast.success("Goal cleared");
    } catch {
      toast.error("Couldn't clear that goal.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-5">
        <h1 className="text-4xl font-bold tracking-tight">Rank goals</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Choose where you want each of your deals to land. We do the arithmetic against whoever is
          currently holding that spot.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Trophy className="h-4 w-4 text-primary" />
            The podium to beat
          </h2>
          <div className="mt-3 space-y-2">
            {podium.length === 0 ? (
              <p className="text-sm text-muted-foreground">No live deals on the board yet.</p>
            ) : (
              podium.map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-bold text-primary">#{o.rank}</span>
                  <Tile initials={o.initials} tint={o.tint} size="sm" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{o.title}</p>
                  <span className="text-sm font-bold">{o.vote_count} votes</span>
                </div>
              ))
            )}
          </div>
          <Link
            to="/"
            search={{ category: "all" }}
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
          >
            Open the full board
          </Link>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Target className="h-4 w-4 text-primary" />
            My deals and goals
          </h2>

          {isLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-surface" />
          ) : mine.length === 0 ? (
            <p className="rounded-xl bg-surface p-8 text-center text-sm text-muted-foreground">
              You have no live deals yet.{" "}
              <Link
                to="/"
                search={{ category: "all" }}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Post an offer
              </Link>{" "}
              and it shows up here.
            </p>
          ) : (
            mine.map((o) => {
              const target = myTargets.find((t) => t.offer_id === o.id)?.target_rank ?? null;
              const goal = target ?? Math.max(o.rank - 1, 1);
              const need = votesNeeded(o, goal);
              const reached = target !== null && o.rank <= target;
              const spanTotal = Math.max(o.rank - goal, 1);
              const progress = reached
                ? 100
                : Math.min(
                    Math.round(((spanTotal - Math.max(o.rank - goal, 0)) / spanTotal) * 100) +
                      (need === 0 ? 100 : 0),
                    100,
                  );

              return (
                <div key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-podium px-2.5 py-1 text-sm font-bold text-accent-foreground">
                      #{o.rank}
                    </span>
                    <Tile initials={o.initials} tint={o.tint} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabel(o.category)} · {o.discount_label} · {o.vote_count} votes
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      Target rank
                      <select
                        value={String(goal)}
                        onChange={(e) => void commit(o.id, Number(e.target.value))}
                        disabled={busy === o.id || !visitorKey}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        {Array.from({ length: Math.max(board.length, 1) }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              #{n}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    {target !== null ? (
                      <button
                        onClick={() => void clear(o.id)}
                        disabled={busy === o.id}
                        className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        clear goal
                      </button>
                    ) : (
                      <button
                        onClick={() => void commit(o.id, goal)}
                        disabled={busy === o.id || !visitorKey}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                      >
                        Track this goal
                      </button>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <ChevronUp className="h-3.5 w-3.5" />
                      {reached || need === 0
                        ? "Goal reached"
                        : `${need} more vote${need === 1 ? "" : "s"} to hit #${goal}`}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {reached || need === 0
                      ? `Holding #${o.rank} — above your #${goal} goal.`
                      : `Currently #${o.rank}. #${goal} is held by ${
                          board[goal - 1]?.merchant ?? "nobody yet"
                        } with ${board[goal - 1]?.vote_count ?? 0} votes.`}
                  </p>
                </div>
              );
            })
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
