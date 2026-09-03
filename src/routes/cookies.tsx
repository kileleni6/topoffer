import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookie Policy — TOPOFFER" }] }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage title="Cookie & Local Storage Policy">
      <section><h2>What we store</h2><p>TOPOFFER uses browser local storage for an anonymous voting identifier, your color theme, and your language preference. These values make core features work without requiring an account.</p></section>
      <section><h2>Essential technology</h2><p>Authentication or security providers may set strictly necessary cookies to maintain sessions, protect requests, and prevent abuse. We do not currently use advertising cookies.</p></section>
      <section><h2>Managing storage</h2><p>You can delete cookies and local storage in your browser settings. Doing so may reset your theme and language and may cause the service to treat your browser as a new visitor.</p></section>
      <section><h2>Updates</h2><p>If analytics or advertising technologies are introduced, this policy and any required consent controls should be updated before those technologies are enabled.</p></section>
    </LegalPage>
  );
}
