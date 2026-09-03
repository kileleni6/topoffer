import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Use — TOPOFFER" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <section><h2>Using TOPOFFER</h2><p>You may browse, vote, and submit genuine offers for lawful purposes. You are responsible for the accuracy of content you submit and for having permission to share it.</p></section>
      <section><h2>Prohibited conduct</h2><ul><li>Do not manipulate rankings, automate votes, impersonate others, or evade safeguards.</li><li>Do not submit unlawful, deceptive, infringing, malicious, or harmful content.</li><li>Do not interfere with the service or attempt unauthorized access.</li></ul></section>
      <section><h2>Third-party offers</h2><p>Offers link to third-party merchants. TOPOFFER does not control their products, pricing, availability, or terms. Verify an offer before purchasing.</p></section>
      <section><h2>Moderation and availability</h2><p>We may remove content, restrict activity, or suspend service to protect users and the platform. The service is provided as available, without a guarantee that every listing is accurate or uninterrupted.</p></section>
      <section><h2>Liability</h2><p>To the extent permitted by law, TOPOFFER is not liable for indirect losses or transactions between users and third parties.</p></section>
    </LegalPage>
  );
}
