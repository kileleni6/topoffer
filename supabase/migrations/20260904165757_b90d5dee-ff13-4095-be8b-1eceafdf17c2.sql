CREATE OR REPLACE FUNCTION public.enforce_rate_limit(_action text, _visitor_key text, _max int, _window_minutes int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used int;
BEGIN
  SELECT count(*) INTO used FROM public.abuse_events
  WHERE action = _action AND visitor_key = _visitor_key
    AND created_at > now() - make_interval(mins => _window_minutes);
  IF used >= _max THEN RAISE EXCEPTION 'Too many requests. Please try again a bit later.'; END IF;
  INSERT INTO public.abuse_events (action, visitor_key) VALUES (_action, _visitor_key);
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_rate_limit(text, text, int, int) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rpc_toggle_vote(_offer_id uuid, _visitor_key uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing uuid;
BEGIN
  PERFORM public.enforce_rate_limit('vote', _visitor_key::text, 60, 60);
  SELECT id INTO existing FROM public.votes WHERE offer_id = _offer_id AND voter_key = _visitor_key::text;
  IF existing IS NOT NULL THEN
    DELETE FROM public.votes WHERE id = existing;
    RETURN 'removed';
  END IF;
  INSERT INTO public.votes (offer_id, voter_key) VALUES (_offer_id, _visitor_key::text);
  RETURN 'added';
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_save_rank_target(_offer_id uuid, _visitor_key uuid, _target_rank int)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enforce_rate_limit('target', _visitor_key::text, 30, 60);
  IF _target_rank IS NULL THEN
    DELETE FROM public.rank_targets WHERE offer_id = _offer_id AND owner_key = _visitor_key::text;
    RETURN 'removed';
  END IF;
  IF _target_rank < 1 OR _target_rank > 500 THEN RAISE EXCEPTION 'Target rank must be between 1 and 500.'; END IF;
  INSERT INTO public.rank_targets (offer_id, owner_key, target_rank)
  VALUES (_offer_id, _visitor_key::text, _target_rank)
  ON CONFLICT (offer_id, owner_key) DO UPDATE SET target_rank = excluded.target_rank;
  RETURN 'saved';
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_register_click(_offer_id uuid, _visitor_key uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enforce_rate_limit('click', _visitor_key::text, 120, 60);
  UPDATE public.offers SET clicks = clicks + 1 WHERE id = _offer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_submit_offer(
  _visitor_key uuid, _title text, _merchant text, _url text, _coupon_code text,
  _discount_label text, _description text, _category text, _starts_at timestamptz,
  _expires_at timestamptz, _tint text, _initials text
)
RETURNS public.offers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE created public.offers;
BEGIN
  PERFORM public.enforce_rate_limit('submit', _visitor_key::text, 5, 60);
  _title := btrim(_title); _merchant := btrim(_merchant); _url := btrim(_url);
  _discount_label := btrim(_discount_label); _description := btrim(coalesce(_description, ''));
  _category := btrim(_category);
  IF length(_title) < 3 OR length(_title) > 140 THEN RAISE EXCEPTION 'Title must be 3-140 characters.'; END IF;
  IF length(_merchant) < 1 OR length(_merchant) > 80 THEN RAISE EXCEPTION 'Merchant must be 1-80 characters.'; END IF;
  IF _url !~* '^https?://' OR length(_url) > 500 THEN RAISE EXCEPTION 'URL must be a valid http(s) link.'; END IF;
  IF length(_discount_label) < 1 OR length(_discount_label) > 40 THEN RAISE EXCEPTION 'Discount label must be 1-40 characters.'; END IF;
  IF length(_description) > 400 THEN RAISE EXCEPTION 'Description must be 400 characters or fewer.'; END IF;
  IF length(_category) < 1 OR length(_category) > 40 THEN RAISE EXCEPTION 'Category must be 1-40 characters.'; END IF;
  IF _coupon_code IS NOT NULL AND length(btrim(_coupon_code)) > 60 THEN RAISE EXCEPTION 'Coupon code must be 60 characters or fewer.'; END IF;
  INSERT INTO public.offers (
    title, merchant, url, coupon_code, discount_label, description,
    category, starts_at, expires_at, tint, initials, owner_key
  ) VALUES (
    _title, _merchant, _url, nullif(btrim(coalesce(_coupon_code, '')), ''), _discount_label, _description,
    _category, coalesce(_starts_at, now()), _expires_at,
    coalesce(nullif(left(_tint, 60), ''), 'oklch(0.55 0.13 300)'),
    coalesce(nullif(upper(left(_initials, 4)), ''), 'OF'), _visitor_key::text
  ) RETURNING * INTO created;
  RETURN created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_toggle_vote(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_save_rank_target(uuid, uuid, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_register_click(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_submit_offer(uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, text, text) TO anon, authenticated;
