import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Action = "toggle_vote" | "submit_offer" | "register_click" | "save_target" | "remove_target";

const json = (body: unknown, status = 200, origin = "") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      vary: "origin",
    },
  });

const allowedOrigin = (request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:8080,http://127.0.0.1:8080")
    .split(",")
    .map((value) => value.trim());
  return allowed.includes(origin) ? origin : "";
};

const digest = async (value: string) => {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return json({ error: "Origin not allowed" }, 403, "null");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, x-client-info, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" } });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server is not configured" }, 503, origin);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action as Action;
    const visitorKey = String(body.visitorKey ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(visitorKey)) return json({ error: "Invalid visitor" }, 400, origin);

    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const fingerprint = await digest(`${ip}|${userAgent}|${visitorKey}`);
    const rules: Record<Action, { event: string; seconds: number; max: number }> = {
      toggle_vote: { event: "vote", seconds: 60, max: 10 },
      submit_offer: { event: "submit", seconds: 3600, max: 3 },
      register_click: { event: "click", seconds: 60, max: 60 },
      save_target: { event: "target", seconds: 60, max: 20 },
      remove_target: { event: "target", seconds: 60, max: 20 },
    };
    const rule = rules[action];
    if (!rule) return json({ error: "Unknown action" }, 400, origin);
    const since = new Date(Date.now() - rule.seconds * 1000).toISOString();
    const { count } = await admin.from("abuse_events").select("id", { count: "exact", head: true }).eq("fingerprint", fingerprint).eq("action", rule.event).gte("created_at", since);
    if ((count ?? 0) >= rule.max) return json({ error: "Too many requests. Please try again later." }, 429, origin);

    if (action === "submit_offer") {
      const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
      if (secret) {
        const token = String(body.captchaToken ?? "");
        const form = new FormData();
        form.set("secret", secret);
        form.set("response", token);
        form.set("remoteip", ip);
        const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form }).then((response) => response.json()) as { success?: boolean };
        if (!result.success) return json({ error: "Security check failed" }, 400, origin);
      }
      const offer = body.offer as Record<string, unknown>;
      const url = new URL(String(offer.url ?? ""));
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid offer URL");
      const payload = {
        title: String(offer.title ?? "").slice(0, 160), merchant: String(offer.merchant ?? "").slice(0, 120),
        url: url.toString(), coupon_code: offer.coupon_code ? String(offer.coupon_code).slice(0, 64) : null,
        discount_label: String(offer.discount_label ?? "").slice(0, 80), description: String(offer.description ?? "").slice(0, 600),
        category: String(offer.category ?? "other").slice(0, 60), starts_at: String(offer.starts_at ?? new Date().toISOString()),
        expires_at: offer.expires_at ? String(offer.expires_at) : null, tint: String(offer.tint ?? "oklch(0.55 0.13 300)"),
        initials: String(offer.initials ?? "OF").slice(0, 3), owner_key: visitorKey,
      };
      if (!payload.title || !payload.merchant || !payload.discount_label) return json({ error: "Missing required fields" }, 400, origin);
      const { data, error } = await admin.from("offers").insert(payload).select("*").single();
      if (error) throw error;
      await admin.from("abuse_events").insert({ fingerprint, action: rule.event });
      return json({ data }, 200, origin);
    }

    const offerId = String(body.offerId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(offerId)) return json({ error: "Invalid offer" }, 400, origin);
    let data: unknown = null;
    if (action === "toggle_vote") {
      const existing = await admin.from("votes").select("id").eq("offer_id", offerId).eq("voter_key", visitorKey).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) {
        const result = await admin.from("votes").delete().eq("id", existing.data.id);
        if (result.error) throw result.error;
        data = "removed";
      } else {
        const result = await admin.from("votes").insert({ offer_id: offerId, voter_key: visitorKey });
        if (result.error) throw result.error;
        data = "added";
      }
    } else if (action === "register_click") {
      const current = await admin.from("offers").select("clicks").eq("id", offerId).single();
      if (current.error) throw current.error;
      const result = await admin.from("offers").update({ clicks: current.data.clicks + 1 }).eq("id", offerId);
      if (result.error) throw result.error;
    } else if (action === "save_target") {
      const targetRank = Math.max(1, Math.min(100, Number(body.targetRank ?? 1)));
      const result = await admin.from("rank_targets").upsert({ offer_id: offerId, owner_key: visitorKey, target_rank: targetRank }, { onConflict: "offer_id,owner_key" });
      if (result.error) throw result.error;
    } else {
      const result = await admin.from("rank_targets").delete().eq("offer_id", offerId).eq("owner_key", visitorKey);
      if (result.error) throw result.error;
    }
    await admin.from("abuse_events").insert({ fingerprint, action: rule.event });
    return json({ data }, 200, origin);
  } catch (error) {
    console.error(error);
    return json({ error: "Request could not be completed" }, 400, origin);
  }
});
