import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Store } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { OfferRow } from "@/components/offer-row";
import { useOffers, useToggleVote, useVisitorKey, useMyVotes } from "@/hooks/use-offer-data";
import { isLive, rankOffers } from "@/lib/offers";

export const Route = createFileRoute("/merchant/$merchant")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.merchant} deals and coupons — TOPOFFER` },
      { name: "description", content: `Find current ${params.merchant} offers, coupons, and community rankings on TOPOFFER.` },
      { property: "og:title", content: `${params.merchant} deals — TOPOFFER` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/topoffer-social-card.png" },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${params.merchant} deals and coupons`,
          description: `Community-ranked offers from ${params.merchant} on TOPOFFER.`,
          isPartOf: { "@type": "WebSite", name: "TOPOFFER" },
        },
      },
    ],
  }),
  component: MerchantPage,
});

function MerchantPage() {
  const { merchant } = Route.useParams();
  const visitorKey = useVisitorKey();
  const { data: offers = [], isLoading } = useOffers();
  const { data: myVotes = [] } = useMyVotes(visitorKey);
  const vote = useToggleVote(visitorKey);
  const votedIds = new Set(myVotes.map((item) => item.offer_id));
  const merchantOffers = rankOffers(
    offers.filter((offer) => offer.merchant === merchant && isLive(offer)),
  );
  const merchantUrl = merchantOffers[0]?.url;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-5xl px-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl bg-surface p-6 sm:p-8">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Store className="h-4 w-4" /> Merchant</p>
            <h1 className="mt-2 break-all text-3xl font-bold tracking-tight">{merchant}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Community-ranked offers and coupon codes from this merchant.</p>
          </div>
          {merchantUrl ? <a href={merchantUrl} target="_blank" rel="nofollow noopener" className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Visit merchant <ExternalLink className="h-3.5 w-3.5" /></a> : null}
        </div>
        <section className="mt-8 space-y-2" aria-label={`${merchant} offers`}>
          {merchantOffers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} voted={votedIds.has(offer.id)} pending={vote.isPending} onVote={(id) => vote.mutate(id)} />
          ))}
          {!isLoading && merchantOffers.length === 0 ? <p className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground">No live offers for this merchant. <Link to="/" search={{ category: "all", period: "all" }} className="text-primary hover:underline">Browse all deals</Link>.</p> : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
