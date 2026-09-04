import { ArrowUpRight, ChevronUp, Tag, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useVisitorKey } from "@/hooks/use-offer-data";
import { Tile } from "./brand";
import { categoryLabel, registerClick, timeAgo, timeLeft, type RankedOffer } from "@/lib/offers";

export function OfferRow({
  offer,
  voted,
  pending,
  onVote,
  mine,
}: {
  offer: RankedOffer;
  voted: boolean;
  pending?: boolean;
  onVote: (id: string) => void;
  mine?: boolean;
}) {
  const visitorKey = useVisitorKey();
  const podium = offer.rank <= 3;

  return (
    <article
      className={`rank-row group flex items-start gap-4 px-4 py-4 ${
        podium ? "rank-row-podium" : "hover:bg-surface"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <span
          className={`w-11 shrink-0 text-center text-sm font-bold ${
            podium
              ? "rounded-lg bg-primary py-1 text-primary-foreground"
              : "py-1 text-muted-foreground"
          }`}
        >
          #{offer.rank}
        </span>
        <button
          onClick={() => onVote(offer.id)}
          disabled={pending}
          aria-pressed={voted}
          aria-label={voted ? "Remove your vote" : "Vote for this offer"}
          className={`flex w-11 flex-col items-center rounded-lg border py-1 text-xs font-bold transition-colors disabled:opacity-50 ${
            voted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          <ChevronUp className="h-3.5 w-3.5" />
          {offer.vote_count}
        </button>
      </div>

      <Tile initials={offer.initials} tint={offer.tint} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-base font-semibold leading-snug">{offer.title}</h3>
          <span className="ml-auto rounded-full bg-podium px-2.5 py-0.5 text-sm font-bold text-accent-foreground">
            {offer.discount_label}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{offer.description}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-accent-foreground">
            {categoryLabel(offer.category)}
          </span>
          <span aria-hidden="true">·</span>
          <Link
            to="/merchant/$merchant"
            params={{ merchant: offer.merchant }}
            className="relative z-10 font-medium hover:text-foreground hover:underline"
          >
            {offer.merchant}
          </Link>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft(offer.expires_at)}
          </span>
          <span aria-hidden="true">·</span>
          <span>posted {timeAgo(offer.created_at)}</span>
          <span aria-hidden="true">·</span>
          <span>{offer.clicks.toLocaleString("en-US")} clicks</span>
          {mine ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-primary">yours</span>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {offer.coupon_code ? (
            <button
              onClick={() => {
                void navigator.clipboard
                  .writeText(offer.coupon_code as string)
                  .then(() => toast.success(`Copied code ${offer.coupon_code}`))
                  .catch(() => toast.error("Couldn't copy — select the code manually."));
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary bg-card px-3 py-1.5 text-xs font-bold tracking-wide text-primary"
            >
              <Tag className="h-3 w-3" />
              {offer.coupon_code}
              <span className="font-medium text-muted-foreground">copy</span>
            </button>
          ) : (
            <span className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted-foreground">
              No code needed
            </span>
          )}
          <a
            href={offer.url}
            target="_blank"
            rel="nofollow noopener"
            onClick={() => {
              void registerClick(offer, visitorKey).catch(() => undefined);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Get deal <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
