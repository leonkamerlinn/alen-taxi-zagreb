# Taxi Zagreb (`alen-taxi-zagreb`)

A Nuxt 3 landing site for a Zagreb taxi service, with **Fingerprint Pro** device identification and a
private, password-protected **admin analytics dashboard**.

- **Live:** https://taxizagreb24.com
- **Hosting:** Google Cloud Run — project `project-57147346-010b-465c-a23`, service `alen-taxi-zagreb`, region `europe-west4`

## Tech stack

- **Nuxt 3** (Vue 3, SSR) · **Tailwind CSS** · **TypeScript**
- **@fingerprintjs/fingerprintjs-pro** — browser identification agent
- Google Fonts (Outfit) · Google Ads gtag (`plugins/gtag.client.ts`)
- **pnpm** · **Docker** (node:20-alpine, serves on `:8080`)

## Project structure

```
alen-taxi-zagreb/
├── pages/                 # index.vue (landing) + login.vue, dashboard.vue (admin)
├── components/            # Hero, Services, About, FAQ, WhatsApp float, CookieConsent, …
├── composables/           # usePageContext, useConsentBanner, useContact, useNavbarScroll, …
├── plugins/               # fingerprint.client.ts (loads the agent), gtag.client.ts
├── server/
│   ├── api/               # identify.post + dashboard/{events,stats,visitor} + auth/{login,logout}
│   ├── middleware/auth.ts # gates /dashboard + /api/dashboard/*
│   └── utils/             # fingerprint (Server API), session (cookie signing), rateLimit
├── docs/                  # FINGERPRINT_SETUP.md, FINGERPRINT_PHASE_B_CLOUDFLARE.md
└── nuxt.config.ts
```

## Local development

```bash
cp example.env .env        # example.env holds the real values (gitignored); or fill .env.example
pnpm install               # (if the pnpm shim is broken on your machine: npm install --no-package-lock)
pnpm run dev               # http://localhost:3000
```

Then log in at `/login` and open `/dashboard`. With the keys unset the site still runs — fingerprinting just
no-ops and the dashboard shows a "not configured" notice.

## Environment variables

Nuxt maps `NUXT_*` / `NUXT_PUBLIC_*` env vars onto `runtimeConfig`. **Server-secret** vars must never reach
the browser; **public** vars are safe to expose.

| Variable | Scope | Purpose |
|---|---|---|
| `NUXT_FINGERPRINT_SECRET_API_KEY` | server secret | Fingerprint **Server API** auth (validates identifications) |
| `NUXT_ADMIN_PASSWORD` | server secret | `/dashboard` login password |
| `NUXT_SESSION_SECRET` | server secret | Signs the admin session + first-party visitor cookies (`openssl rand -hex 32`) |
| `NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY` | public | Browser agent key — `AyRoy4mfOeDlCinfWqpx` (domain-locked) |
| `NUXT_PUBLIC_FINGERPRINT_REGION` | public | Workspace region — `eu` |
| `NUXT_PUBLIC_FINGERPRINT_ENDPOINT` | public | Optional custom first-party subdomain (Safari ITP) |
| `NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN` | public | Optional custom agent-script URL |

Real values live in **`example.env`** (gitignored, do not commit). **`.env.example`** is the committed
placeholder template. Secrets are never stored in git — in production they come from **Secret Manager**.

> This is the **primary Fingerprint Pro workspace**; the sibling `tim-taxi-zagreb` reuses the same keys, so
> both sites' events are pooled. The dashboard's **"Po domeni"** card + **Domena** column show which domain
> each visit came from (derived from the event URL). See `docs/FINGERPRINT_SETUP.md`.

## Fingerprint Pro & admin dashboard

```
Browser → Fingerprint agent → fp.get({ tag: page context })
        → POST /api/identify { requestId }
              → server looks the event up with the SECRET key (tamper-proof)
                sets a signed, httpOnly first-party cookie (returning-visitor continuity)
You    → /login → /dashboard
              → server calls Fingerprint Server API → live stats + recent visits (no database)
```

There is **no database** — the dashboard reads live from Fingerprint's Server API (history limited to
Fingerprint's ~30-day retention). Full setup walkthrough: [`docs/FINGERPRINT_SETUP.md`](docs/FINGERPRINT_SETUP.md)
(Safari first-party subdomain: [`docs/FINGERPRINT_PHASE_B_CLOUDFLARE.md`](docs/FINGERPRINT_PHASE_B_CLOUDFLARE.md)).

## Deployment (Cloud Run)

The container builds from the `Dockerfile` (`pnpm install --frozen-lockfile` → `pnpm build` →
`node .output/server/index.mjs`) and serves on `:8080`. Public vars are set inline; secrets are mounted from
Secret Manager:

```bash
gcloud run deploy alen-taxi-zagreb \
  --source . \
  --project project-57147346-010b-465c-a23 \
  --region europe-west4 \
  --update-env-vars 'NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY=AyRoy4mfOeDlCinfWqpx,NUXT_PUBLIC_FINGERPRINT_REGION=eu' \
  --update-secrets 'NUXT_FINGERPRINT_SECRET_API_KEY=fingerprint-secret-api-key:latest,NUXT_ADMIN_PASSWORD=taxi-admin-password:latest,NUXT_SESSION_SECRET=taxi-session-secret:latest'
```

> Always deploy to **`europe-west4`** — that's the region the live domain maps to. See
> `docs/FINGERPRINT_SETUP.md` for the one-time Secret Manager + IAM setup.

## Notes

- **Fingerprinting is always-on** (every visitor). Device fingerprinting is personal data under GDPR —
  disclose it in your privacy/cookie notice. To make it consent-gated, see the commented line in
  `plugins/fingerprint.client.ts`.
- **Allowlist:** for the browser agent to run on the live domain, add `https://taxizagreb24.com` (and
  `http://localhost:3000`) to the public key's allowed origins in the Fingerprint dashboard (Security → Web).
