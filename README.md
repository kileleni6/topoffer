# Bid Buddy

clone this https://outbid.lol/

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3694f255-d6ef-4138-ab87-976df4a94b16).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Security deployment

Public writes are handled by `supabase/functions/secure-action`. Apply the migrations, deploy that function, and configure `ALLOWED_ORIGINS`. To require CAPTCHA on submissions, configure both `VITE_TURNSTILE_SITE_KEY` in the web app and `TURNSTILE_SECRET_KEY` as an Edge Function secret. Never expose the secret as a `VITE_` variable.

```sh
supabase db push
supabase functions deploy secure-action
supabase secrets set ALLOWED_ORIGINS=https://your-domain.example
supabase secrets set TURNSTILE_SECRET_KEY=your-secret
```

The current legal pages are templates. Complete the checklist in `LEGAL_REVIEW_REQUIRED.md` with qualified counsel before launch.
