import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type RuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
};

const sitemapCategories = [
  "software", "ai-tools", "saas", "hosting", "marketing", "seo", "design", "courses",
  "finance", "crypto", "retail", "fashion", "electronics", "home", "food", "travel",
  "health", "beauty", "pets", "kids", "sports", "auto", "gaming", "entertainment",
  "mobile", "business", "freelance", "events", "ai-agents-infrastructure",
  "seo-ai-visibility", "marketing-advertising", "crypto-web3-investing", "developer-tools",
  "business-finance-legal", "security-privacy-compliance", "health-fitness-wellness",
  "social-creator-tools", "leaderboards-attention", "hiring-jobs-careers", "education-learning",
  "agencies-studios-services", "ecommerce-retail", "domains-web-assets", "games-entertainment",
  "people-profiles", "productivity-personal-tools", "design-creative", "writing-content",
  "directories-launch-discovery", "ai-media-generation", "audio-voice-podcasting",
  "sales-lead-generation", "travel-local-lifestyle", "real-estate-property", "media-news",
];

const xmlEscape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

async function createSitemap(request: Request, env: RuntimeEnv) {
  const origin = new URL(request.url).origin;
  const urls = ["/", "/categories", "/about", "/privacy", "/terms", "/cookies"];
  for (const category of sitemapCategories) urls.push(`/?category=${category}&period=all`);
  if (env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY) {
    try {
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/offers?select=merchant&limit=1000`, {
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` },
      });
      if (response.ok) {
        const rows = await response.json() as { merchant?: string }[];
        for (const merchant of new Set(rows.map((row) => row.merchant).filter(Boolean))) {
          urls.push(`/merchant/${encodeURIComponent(merchant as string)}`);
        }
      }
    } catch {
      // Static routes still produce a valid sitemap if the data service is unavailable.
    }
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${xmlEscape(origin + path)}</loc></url>`).join("\n")}\n</urlset>`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      if (new URL(request.url).pathname === "/sitemap.xml") {
        return await createSitemap(request, (env ?? {}) as RuntimeEnv);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
