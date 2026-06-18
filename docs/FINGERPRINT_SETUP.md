# Fingerprint Pro — Setup Guide

This site now tracks visitor traffic with **Fingerprint Pro** (device identification) and exposes a
private **admin dashboard** at `/dashboard` to view it.

There is **no database** — the dashboard reads live from Fingerprint's Server API (so history is limited
to Fingerprint's retention window, ~30 days on non‑Enterprise plans). The page/referrer/UTM context of
each visit travels inside the event's `tag`, so nothing of ours needs to be stored.

> **TL;DR — what I need from you:** a Fingerprint Pro **EU** account with a **Public API key** + **Secret
> API key**, your **custom domain**, and a **dashboard password**. Drop them into Cloud Run env vars /
> Secret Manager (commands below) and deploy.

---

## How it works

```
Browser  →  Fingerprint agent (always-on)  →  fp.get({ tag: page context })
            └ event recorded by Fingerprint (incl. your tag)
         →  POST /api/identify { requestId }
                └ server looks the event up with the SECRET key  ← tamper-proof signals
                  sets a signed, httpOnly first-party cookie (returning-visitor continuity)

You      →  /login  →  /dashboard
            └ server calls Fingerprint Server API (secret key) → live stats + recent visits
```

The Secret API key **never** reaches the browser. The browser only ever holds the Public key.

---

## Step 1 — Create the Fingerprint Pro account (choose EU!)

1. Sign up at <https://dashboard.fingerprint.com>.
2. **Choose the EU region when prompted. This is irreversible** and is the correct, GDPR‑friendly choice
   for Croatia (data stays in Frankfurt). The whole integration is preconfigured for `eu`.
   - The free trial is a 14‑day Pro Plus trial (good enough to verify everything end‑to‑end).

## Step 2 — Get the API keys

In the dashboard go to **App settings → API Keys**:

- **Public API key** → goes in `NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY` (safe to expose to the browser).
- **Secret API key** → goes in `NUXT_FINGERPRINT_SECRET_API_KEY` (server‑only secret).

Then **restrict the Public key to your domain(s)** (API Keys → the public key → allowed origins) so nobody
else can run up your quota: add `https://<YOUR_DOMAIN>` (and `https://metrics.<YOUR_DOMAIN>` if you set up
the subdomain in Step 4).

## Step 3 — Pick a dashboard password + session secret

- Choose any password → `NUXT_ADMIN_PASSWORD`.
- Generate a random signing secret:
  ```bash
  openssl rand -hex 32
  ```
  → `NUXT_SESSION_SECRET`.

---

## Step 4 — Custom subdomain for Safari (optional but recommended)

Safari's Intelligent Tracking Prevention (ITP) degrades third‑party fingerprinting. Serving the agent
**first‑party** from a subdomain of your own domain fixes most of it. **You need a real custom domain for
this — it cannot be done on a `*.run.app` URL.** Two options:

### Option A — CNAME custom subdomain (simple)

Result: first‑party script + API. On **Safari 16.4+ cookies are still capped to ~7 days** (the core
device id stays strong; only long‑term cookie continuity is limited).

1. Dashboard → **App settings → Subdomain integration** → add a subdomain, e.g. `metrics.<YOUR_DOMAIN>`.
   - Avoid names containing "fingerprint"/"fingerprintjs" (ad‑blocker fodder). `metrics`, `id`, `m` are fine.
2. Add the **CNAME record** the dashboard shows to your DNS. This validates ownership and triggers
   automatic SSL issuance (can take up to ~24h).
3. When status becomes **Issued**, add the **two A records** the dashboard provides.
4. Set these env vars (Step 6) — copy the **exact** `scriptUrlPattern` value the dashboard generates:
   ```
   NUXT_PUBLIC_FINGERPRINT_ENDPOINT=https://metrics.<YOUR_DOMAIN>
   NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN=<value shown in the dashboard subdomain setup>
   ```

### Option B — Cloudflare proxy integration (best Safari longevity)

> **This is the chosen path for production.** A full, project‑specific runbook (real domain, region, commands,
> verification, rollback) lives in [`FINGERPRINT_PHASE_B_CLOUDFLARE.md`](./FINGERPRINT_PHASE_B_CLOUDFLARE.md).

Result: ~1‑year Safari cookies. Requires **Cloudflare in front of `<YOUR_DOMAIN>`** (change nameservers to
Cloudflare and proxy the domain).

1. Put `<YOUR_DOMAIN>` on Cloudflare (orange‑cloud proxied).
2. Follow Fingerprint's **Cloudflare integration** guide
   (<https://docs.fingerprint.com/docs/cloudflare-integration>) to deploy their Worker and route, which
   proxies both the agent script and the API through your domain.
3. Set `NUXT_PUBLIC_FINGERPRINT_ENDPOINT` / `NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN` to the values the
   integration gives you.

> **Leaving these empty is fine** — the agent falls back to Fingerprint's CDN/API and still works
> everywhere; only Safari first‑party accuracy is reduced. You can add the subdomain later without code changes.

---

## Step 5 — Local development

```bash
cp .env.example .env          # then fill in the values
npm install --no-package-lock # local install (pnpm shim is broken on this machine)
npm run dev                   # http://localhost:3000
```

Visit `http://localhost:3000`, then log in at `http://localhost:3000/login` and open `/dashboard`.
(Cookies are marked `secure`, so log‑in works on `https://` in production; on plain‑HTTP localhost some
browsers still accept `secure` cookies for `localhost` — if not, test against the deployed URL.)

---

## Step 6 — Deploy to Cloud Run

Project `project-57147346-010b-465c-a23`, service `alen-taxi-zagreb`, region `europe-west4`.

**1. Store the three secrets in Secret Manager (once):**

```bash
printf '%s' 'YOUR_FINGERPRINT_SECRET_API_KEY' | gcloud secrets create fingerprint-secret-api-key --data-file=- --replication-policy=automatic
printf '%s' 'YOUR_DASHBOARD_PASSWORD'        | gcloud secrets create taxi-admin-password        --data-file=- --replication-policy=automatic
printf '%s' "$(openssl rand -hex 32)"        | gcloud secrets create taxi-session-secret        --data-file=- --replication-policy=automatic
```

**2. Let the Cloud Run service account read them** (default runtime SA is
`<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`):

```bash
PROJECT_NUMBER=$(gcloud projects describe project-57147346-010b-465c-a23 --format='value(projectNumber)')
for s in fingerprint-secret-api-key taxi-admin-password taxi-session-secret; do
  gcloud secrets add-iam-policy-binding "$s" \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

**3. Deploy** (public vars inline, secrets mounted):

```bash
gcloud run deploy alen-taxi-zagreb \
  --source . \
  --project project-57147346-010b-465c-a23 \
  --region europe-west4 \
  --set-env-vars 'NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY=YOUR_PUBLIC_KEY,NUXT_PUBLIC_FINGERPRINT_REGION=eu' \
  --set-secrets 'NUXT_FINGERPRINT_SECRET_API_KEY=fingerprint-secret-api-key:latest,NUXT_ADMIN_PASSWORD=taxi-admin-password:latest,NUXT_SESSION_SECRET=taxi-session-secret:latest'
```

If you set up the subdomain (Step 4), append the two public vars to `--set-env-vars`:
```
,NUXT_PUBLIC_FINGERPRINT_ENDPOINT=https://metrics.<YOUR_DOMAIN>,NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN=<value from dashboard>
```

> `--set-env-vars` / `--set-secrets` **replace** the full set each deploy — always pass them all together,
> or use `--update-env-vars` / `--update-secrets` to change individual ones.

---

## Step 7 — Verify

1. Open the live site in a normal browser. In DevTools → Network you should see the Fingerprint agent load
   and a `POST /api/identify` returning `200 {ok:true}`.
2. In the Fingerprint dashboard → **Identification**, the visit appears within seconds, and its `tag` shows
   your `path` / `referrer` / `utm`.
3. Go to `https://<YOUR_DOMAIN>/login`, enter the password → you land on `/dashboard` with stat cards, a
   per‑day chart, top pages, countries, and a recent‑visits table. Wrong password is rejected.
4. Visiting `/dashboard` without logging in redirects to `/login`.

---

## GDPR note (fingerprinting is currently ALWAYS‑ON)

Per your choice, the agent runs for **every** visitor regardless of the cookie banner. Device
fingerprinting is personal data under EU/GDPR, so:

- **Update your privacy policy / cookie notice** to disclose that you use device fingerprinting for traffic
  analytics, the purpose, and the retention.
- Data stays in the **EU** region (Frankfurt).
- **To switch to consent‑gated** (only fingerprint after the visitor accepts cookies), open
  `plugins/fingerprint.client.ts` and uncomment the single line:
  ```ts
  // if (localStorage.getItem('cookie-consent') !== 'accepted') return
  ```
  That reuses the existing banner in `components/CookieConsent.vue`.
- **Data deletion (right to erasure):** Fingerprint's Server API supports
  `DELETE /visitors/{visitorId}` — ask me to wire it into an admin action if you ever need it.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Dashboard shows "Fingerprint nije konfiguriran" | `NUXT_FINGERPRINT_SECRET_API_KEY` / public key not set. |
| `/api/identify` returns `{ok:false}`, events missing | **Region mismatch** — the account region must be **EU** and `NUXT_PUBLIC_FINGERPRINT_REGION=eu`. A 404 from the Server API almost always means wrong region. |
| No agent request in Network | An **ad‑blocker** blocked the default CDN. Set up the custom subdomain (Step 4) to load first‑party. |
| Safari shows fewer returning visitors | Expected with Option A (~7‑day cap). Use Option B (Cloudflare) for ~1 year. |
| Login works locally but not in prod | Cookies are `secure` — must be served over HTTPS (Cloud Run is, by default). |
| History older than ~30 days is gone | Expected — no database by design. Ask me to add Firestore + a webhook if you want long‑term history. |

---

## Reference

**Environment variables** (see `.env.example`):

| Variable | Where | Purpose |
|---|---|---|
| `NUXT_FINGERPRINT_SECRET_API_KEY` | Secret Manager | Server API auth (never exposed) |
| `NUXT_ADMIN_PASSWORD` | Secret Manager | `/dashboard` login password |
| `NUXT_SESSION_SECRET` | Secret Manager | Signs session + visitor cookies (`openssl rand -hex 32`) |
| `NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY` | env var | Browser agent key (domain‑locked) |
| `NUXT_PUBLIC_FINGERPRINT_REGION` | env var | `eu` |
| `NUXT_PUBLIC_FINGERPRINT_ENDPOINT` | env var | Custom subdomain API endpoint (optional) |
| `NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN` | env var | Custom subdomain script URL (optional) |

**Key files added**

- `plugins/fingerprint.client.ts` — loads the agent, identifies, posts the requestId.
- `composables/usePageContext.ts` — builds the page/UTM `tag`.
- `server/api/identify.post.ts` — server‑side validation + first‑party cookie.
- `server/api/dashboard/{stats,events}.get.ts` — dashboard data (protected).
- `server/api/auth/{login,logout}.post.ts`, `server/middleware/auth.ts` — admin auth.
- `server/utils/{fingerprint,session,rateLimit}.ts` — Server API wrappers, cookie signing, rate limiting.
- `pages/dashboard.vue`, `pages/login.vue` — the admin UI.
