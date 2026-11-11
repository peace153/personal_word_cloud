# Live Word Cloud — Vercel version

One URL, two views:
- **Phone / tablet** → type one word and send.
- **Laptop / desktop (wide window)** → projector word cloud, QR code + link, and host controls
  (Edit question, Hide words, Fullscreen, Clear all). Force a view with `?view=display` or `?view=join`.

Words, hidden words and the question live in **Upstash Redis**, so every visitor shares one list.
Without Redis configured the API returns a clear error rather than keeping separate per-instance lists.

## Deploy

1. From this folder: `npx vercel` (log in, accept the defaults: no framework, `public/` is served, `api/` becomes functions).
   If you deploy from a Git repo instead, set the project's **Root Directory** to `vercel`.
2. Vercel dashboard → your project → **Storage** → **Create** → **Upstash for Redis** (free plan) → connect it to the project.
   This injects `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`); both are supported.
3. Redeploy so the new variables are live: `npx vercel --prod`.
4. Open the production URL on your laptop (wide window) for the host page. The QR code and link are built from the
   address you opened, so open it via the final production URL, not a preview URL.
5. Before the event: open the host page, click **Clear all** to remove any test words.

## Notes
- Input cleaning is server-side (`lib/clean.js`): trim, lowercase, one word, 50 visible characters, English + basic Thai profanity blocked.
- The question defaults to "In one word, how do you feel about AI?" and can be changed from the host page.
- Anyone who opens the link on a wide-screen laptop sees the host controls. Add a password if that matters for your event.
- For offline testing without Redis, use the sibling `local/` folder.
