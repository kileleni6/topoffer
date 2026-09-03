-- Route public mutations through the secure-action Edge Function. The service role
-- bypasses RLS; anonymous clients retain read-only access.
DROP POLICY IF EXISTS "offers_public_insert" ON public.offers;
DROP POLICY IF EXISTS "offers_public_update" ON public.offers;
DROP POLICY IF EXISTS "votes_public_insert" ON public.votes;
DROP POLICY IF EXISTS "votes_public_delete" ON public.votes;
DROP POLICY IF EXISTS "targets_public_insert" ON public.rank_targets;
DROP POLICY IF EXISTS "targets_public_update" ON public.rank_targets;
DROP POLICY IF EXISTS "targets_public_delete" ON public.rank_targets;

REVOKE INSERT, UPDATE, DELETE ON public.offers FROM anon, authenticated;
REVOKE INSERT, DELETE ON public.votes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.rank_targets FROM anon, authenticated;

CREATE TABLE public.abuse_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fingerprint text NOT NULL,
  action text NOT NULL CHECK (action IN ('vote', 'submit', 'click', 'target')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX abuse_events_window_idx
  ON public.abuse_events (fingerprint, action, created_at DESC);

ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.abuse_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.abuse_events TO service_role;

-- Keep the rate-limit table bounded without depending on client cleanup.
CREATE OR REPLACE FUNCTION public.prune_abuse_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.abuse_events WHERE created_at < now() - interval '7 days';
$$;

REVOKE ALL ON FUNCTION public.prune_abuse_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_abuse_events() TO service_role;
