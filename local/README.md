# Live Word Cloud

One URL, two views:
- **Phone / tablet** → type one word and send.
- **Laptop / desktop (wide window)** → the projector word cloud, QR code, link, and hide/clear controls.
  Force a view with `?view=display` or `?view=join`.

Words are cleaned server-side (trim, lowercase, 50 visible characters max (Thai marks count with their consonant), one word, English + basic Thai profanity blocked) and stored in Upstash Redis
so every visitor shares one list.

## Deploy
1. `npx vercel` (log in, accept defaults — no framework, `public/` is served, `api/` becomes functions).
2. Vercel dashboard → your project → **Storage** → **Create** → **Upstash for Redis** (free plan) → connect to the project.
   This injects `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`); both are supported.
3. `npx vercel --prod` again so the new env vars are live. Open the URL on your laptop for the display.

Without Redis on Vercel the API returns a clear error instead of silently keeping separate lists.

## Local dev
`npm run dev` → http://localhost:3000 (in-memory store, resets on restart).
