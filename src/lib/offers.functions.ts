import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const RATE_LIMITS: Record<string, { max: number; windowMinutes: number }> = {
  vote: { max: 60, windowMinutes: 60 },
  submit: { max: 5, windowMinutes: 60 },
  target: { max: 30, windowMinutes: 60 },
  click: { max: 120, windowMinutes: 60 },
};

const visitorKey = z.string().uuid();

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("vote"), visitorKey, offerId: z.string().uuid() }),
  z.object({
    action: z.literal("target"),
    visitorKey,
    offerId: z.string().uuid(),
    targetRank: z.number().int().min(1).max(500).nullable(),
  }),
  z.object({ action: z.literal("click"), visitorKey, offerId: z.string().uuid() }),
  z.object({
    action: z.literal("submit"),
    visitorKey,
    offer: z.object({
      title: z.string().trim().min(3).max(140),
      merchant: z.string().trim().min(1).max(80),
      url: z.string().trim().url().max(500),
      coupon_code: z.string().trim().max(60).nullable(),
      discount_label: z.string().trim().min(1).max(40),
      description: z.string().trim().max(400),
      category: z.string().trim().min(1).max(40),
      starts_at: z.string().min(1),
      expires_at: z.string().nullable(),
      tint: z.string().max(60),
      initials: z.string().max(4),
    }),
  }),
]);

type Action = z.infer<typeof actionSchema>;

export const secureAction = createServerFn({ method: "POST" })
  .validator((input: unknown) => actionSchema.parse(input))
  .handler(async ({ data }: { data: Action }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ipHint =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;

    const limit = RATE_LIMITS[data.action]!;
    const since = new Date(Date.now() - limit.windowMinutes * 60_000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from("abuse_events")
      .select("id", { count: "exact", head: true })
      .eq("action", data.action)
      .eq("visitor_key", data.visitorKey)
      .gte("created_at", since);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= limit.max) {
      throw new Error("Too many requests. Please try again a bit later.");
    }
    const { error: eventError } = await supabaseAdmin
      .from("abuse_events")
      .insert({ action: data.action, visitor_key: data.visitorKey, ip_hint: ipHint });
    if (eventError) throw new Error(eventError.message);

    if (data.action === "vote") {
      const { data: existing, error: readError } = await supabaseAdmin
        .from("votes")
        .select("id")
        .eq("offer_id", data.offerId)
        .eq("voter_key", data.visitorKey)
        .maybeSingle();
      if (readError) throw new Error(readError.message);
      if (existing) {
        const { error } = await supabaseAdmin.from("votes").delete().eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { result: "removed" as const };
      }
      const { error } = await supabaseAdmin
        .from("votes")
        .insert({ offer_id: data.offerId, voter_key: data.visitorKey });
      if (error) throw new Error(error.message);
      return { result: "added" as const };
    }

    if (data.action === "target") {
      if (data.targetRank == null) {
        const { error } = await supabaseAdmin
          .from("rank_targets")
          .delete()
          .eq("offer_id", data.offerId)
          .eq("owner_key", data.visitorKey);
        if (error) throw new Error(error.message);
        return { result: "removed" as const };
      }
      const { error } = await supabaseAdmin
        .from("rank_targets")
        .upsert(
          { offer_id: data.offerId, owner_key: data.visitorKey, target_rank: data.targetRank },
          { onConflict: "offer_id,owner_key" },
        );
      if (error) throw new Error(error.message);
      return { result: "saved" as const };
    }

    if (data.action === "click") {
      const { data: row, error: readError } = await supabaseAdmin
        .from("offers")
        .select("clicks")
        .eq("id", data.offerId)
        .maybeSingle();
      if (readError) throw new Error(readError.message);
      if (row) {
        const { error } = await supabaseAdmin
          .from("offers")
          .update({ clicks: (row.clicks ?? 0) + 1 })
          .eq("id", data.offerId);
        if (error) throw new Error(error.message);
      }
      return { result: "ok" as const };
    }

    const { data: created, error } = await supabaseAdmin
      .from("offers")
      .insert({ ...data.offer, owner_key: data.visitorKey })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { result: "created" as const, offer: created };
  });
