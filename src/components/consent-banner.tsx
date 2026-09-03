import { useEffect, useState } from "react";

type Consent = { analytics: boolean; advertising: boolean; decidedAt: string };
const CONSENT_KEY = "topoffer:consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => setVisible(!window.localStorage.getItem(CONSENT_KEY)), []);

  const save = (value: Omit<Consent, "decidedAt">) => {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...value, decidedAt: new Date().toISOString() }));
    window.dispatchEvent(new CustomEvent("topoffer:consent", { detail: value }));
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl" aria-labelledby="consent-title">
      <h2 id="consent-title" className="font-bold">Your privacy choices</h2>
      <p className="mt-1 text-sm text-muted-foreground">Essential storage keeps votes, theme, and language working. Optional analytics and advertising stay off unless you allow them.</p>
      {customizing ? (
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between gap-4"><span><strong className="text-sm">Analytics</strong><span className="block text-xs text-muted-foreground">Helps improve performance and features.</span></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" /></label>
          <label className="flex items-center justify-between gap-4"><span><strong className="text-sm">Advertising</strong><span className="block text-xs text-muted-foreground">Allows personalized promotion and attribution.</span></span><input type="checkbox" checked={advertising} onChange={(event) => setAdvertising(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" /></label>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => save({ analytics: true, advertising: true })} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Allow optional</button>
        <button type="button" onClick={() => save({ analytics: false, advertising: false })} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Essential only</button>
        {customizing ? <button type="button" onClick={() => save({ analytics, advertising })} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Save choices</button> : <button type="button" onClick={() => setCustomizing(true)} className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Customize</button>}
      </div>
    </aside>
  );
}
