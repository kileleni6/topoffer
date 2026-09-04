CREATE TABLE public.abuse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  visitor_key text NOT NULL,
  ip_hint text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.abuse_events TO service_role;
ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abuse_events service only" ON public.abuse_events FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX abuse_events_lookup_idx ON public.abuse_events (action, visitor_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.prune_abuse_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE removed integer;
BEGIN
  DELETE FROM public.abuse_events WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

DROP POLICY IF EXISTS offers_public_insert ON public.offers;
DROP POLICY IF EXISTS offers_public_update ON public.offers;
DROP POLICY IF EXISTS votes_public_insert ON public.votes;
DROP POLICY IF EXISTS votes_public_delete ON public.votes;
DROP POLICY IF EXISTS targets_public_insert ON public.rank_targets;
DROP POLICY IF EXISTS targets_public_update ON public.rank_targets;
DROP POLICY IF EXISTS targets_public_delete ON public.rank_targets;

REVOKE INSERT, UPDATE, DELETE ON public.offers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.votes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.rank_targets FROM anon, authenticated;

GRANT SELECT ON public.offers TO anon, authenticated;
GRANT SELECT ON public.votes TO anon, authenticated;
GRANT SELECT ON public.rank_targets TO anon, authenticated;
GRANT ALL ON public.offers TO service_role;
GRANT ALL ON public.votes TO service_role;
GRANT ALL ON public.rank_targets TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_voter_offer ON public.votes (offer_id, voter_key);
CREATE UNIQUE INDEX IF NOT EXISTS rank_targets_unique_owner_offer ON public.rank_targets (offer_id, owner_key);
