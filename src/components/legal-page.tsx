import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./site-header";

export function LegalPage({
  title,
  updated = "September 4, 2026",
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="text-sm font-semibold text-primary">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_p+p]:mt-3 [&_ul]:ml-5 [&_ul]:list-disc">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
