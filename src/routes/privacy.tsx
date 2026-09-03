import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — TOPOFFER" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <section><h2>Information we collect</h2><p>TOPOFFER stores the deal information you submit, an anonymous browser identifier used to prevent duplicate votes, and basic technical data required to operate and secure the service. We do not require an account to browse or vote.</p></section>
      <section><h2>How we use information</h2><p>We use information to publish and rank offers, remember votes and preferences, prevent abuse, diagnose errors, and improve service reliability.</p></section>
      <section><h2>Sharing and retention</h2><p>We do not sell personal information. Service providers may process limited data on our behalf for hosting, databases, analytics, and security. We retain information only as long as reasonably needed for these purposes or required by law.</p></section>
      <section><h2>Your choices</h2><p>You can clear local browser data to remove your anonymous identifier, theme, and language preference. To request access, correction, or deletion of submitted information, contact the site operator through the project’s published support channel.</p></section>
      <section><h2>Changes</h2><p>We may update this policy as the service changes. The date above identifies the latest revision.</p></section>
    </LegalPage>
  );
}
