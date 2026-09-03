# Supabase setup (low-cost configuration)

TOPOFFER needs one Supabase project. The browser reads public offers; all public writes go through one Edge Function so the service-role key never reaches the browser.

## Required setup

1. Create a Supabase project. Add its Project URL, public anon key, and project ID to the web host:

   ```env
   VITE_SUPABASE_URL=https://PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
   VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_ENABLE_CLICK_TRACKING=false
   ```

2. Install the Supabase CLI, sign in, link this folder, apply the migrations, and deploy the write endpoint:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   supabase functions deploy secure-action
   supabase secrets set ALLOWED_ORIGINS=https://your-domain.example
   ```

3. Set the production Site URL in Authentication > URL Configuration. The current app does not require paid authentication providers.

## Optional CAPTCHA

Cloudflare Turnstile is checked only during deal submission. Put the public site key in the web host and the secret only in Supabase:

```env
VITE_TURNSTILE_SITE_KEY=YOUR_PUBLIC_SITE_KEY
```

```sh
supabase secrets set TURNSTILE_SECRET_KEY=YOUR_SECRET_KEY
```

## Keep resource use low

- Leave `VITE_ENABLE_CLICK_TRACKING=false`. Enabling it causes a function invocation and database operations for every outbound click.
- Offer data is cached in each browser for five minutes; refetch-on-window-focus is disabled.
- Public reads are capped at 500 offers. The UI paginates them in groups of 100.
- Do not enable Realtime for these tables; the app does not use it.
- Keep images outside Supabase Storage, using the web host or an image CDN.
- CAPTCHA runs only for submissions, never ordinary page views.
- Check Dashboard > Reports periodically and configure a spend cap or alert if your plan offers it.
- Run `select public.prune_abuse_events();` weekly in the SQL editor. It removes rate-limit records older than seven days.

## Server-side components

- `offers`: published offers and cached vote totals
- `votes`: one row per visitor and offer
- `rank_targets`: optional personal rank goals
- `abuse_events`: short-lived rate-limit records
- `secure-action`: validation, rate limits, votes, submissions, targets, and optional clicks

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `TURNSTILE_SECRET_KEY` in a `VITE_` variable or commit them to Git.
