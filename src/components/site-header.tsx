import { Link } from "@tanstack/react-router";
import { Logo } from "./brand";
import { SitePreferences, useLanguage } from "./site-preferences";

export type DealPeriod = "today" | "yesterday" | "week" | "month" | "all";

const periodLabels: { id: DealPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All-time" },
];

export function SiteHeader({
  period,
  onPeriodChange,
}: {
  scope?: "board" | "dashboard";
  period?: DealPeriod;
  onPeriodChange?: (period: DealPeriod) => void;
}) {
  const { language, setLanguage, labels } = useLanguage();

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-5 py-6">
      <Logo />
      {period && onPeriodChange ? (
        <div className="order-3 flex w-full items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:order-none lg:w-auto">
          {periodLabels.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPeriodChange(item.id)}
              aria-pressed={period === item.id}
              className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium shadow-card transition-colors ${
                period === item.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
        <Link
          to="/"
          search={{ category: "all" }}
          className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
          activeOptions={{ exact: true }}
        >
          {labels.deals}
        </Link>
        <Link
          to="/today"
          className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {labels.dashboard}
        </Link>
        <Link
          to="/ranking"
          className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {labels.ranking}
        </Link>
        <Link
          to="/categories"
          className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {labels.categories}
        </Link>
        <Link
          to="/about"
          className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {labels.about}
        </Link>
      </nav>
      <SitePreferences language={language} setLanguage={setLanguage} labels={labels} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
        <Logo />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
          <p>Community-ranked offers, deals and coupon codes. Votes decide the podium.</p>
        </div>
      </div>
    </footer>
  );
}
