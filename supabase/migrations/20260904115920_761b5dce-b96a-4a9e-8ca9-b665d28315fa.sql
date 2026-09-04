REVOKE EXECUTE ON FUNCTION public.prune_abuse_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_abuse_events() TO service_role;
