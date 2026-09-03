import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined;
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let widgetId = "";
    const render = () => {
      if (!window.turnstile || !container.current || widgetId) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onToken(""),
        theme: "auto",
      });
    };
    const existing = document.querySelector<HTMLScriptElement>("script[data-topoffer-turnstile]");
    if (existing) {
      existing.addEventListener("load", render);
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset["topofferTurnstile"] = "true";
      script.addEventListener("load", render);
      document.head.appendChild(script);
    }
    return () => {
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onToken, siteKey]);

  if (!siteKey) return null;
  return <div ref={container} className="min-h-[65px] sm:col-span-2" aria-label="Security check" />;
}
