# Taxi Zagreb (`alen-taxi-zagreb`)

A Nuxt 3 landing site for a Zagreb taxi service. It runs **Fingerprint Pro** device identification
**only on paid Google Ads traffic** and forwards each identification to the shared **ClickShield**
backend for click-fraud analysis. Also loads **Google Ads gtag** for conversion tracking.

- **Live:** https://taxizagreb24.com
- **Hosting:** Google Cloud Run — project `project-57147346-010b-465c-a23`, service `alen-taxi-zagreb`, region `europe-west4`
- **Deploys:** automatically via GitHub Actions on every push to `main` (see [Deployment](#deployment-cloud-run))

> **Frontend-only.** This site has no backend of its own — no `server/` API, no database, no admin
> dashboard. The browser posts the Fingerprint `requestId` directly to ClickShield, which owns the
> Fingerprint **secret** key, stores events in Postgres, and serves the analytics dashboard. See the
> sibling [`clickshield`](https://github.com/leonkamerlinn/clickshield) repo.

## Tech stack

- **Nuxt 3** (Vue 3, SSR) · **Tailwind CSS** · **TypeScript**
- **@fingerprintjs/fingerprintjs-pro** — browser identification agent
- **Google Ads gtag** (`AW-17804137574`, `plugins/gtag.client.ts`) · Google Fonts (Outfit)
- **pnpm** · **Docker** (node:20-alpine, serves on `:8080`)

## Tracking: ClickShield's hosted script

Since 2026-10-17 the site tracks paid Google Ads clicks with ClickShield's hosted script: one tag,
first in the page head (`app.head.script` in [`nuxt.config.ts`](nuxt.config.ts)).

```html
<script async src="https://clickshield-web-370434332956.europe-west4.run.app/cs.js"
  data-fp-agent="https://metrics.taxizagreb24.com/agent-m0zfpmtcwbpc"
  data-fp-endpoint="https://metrics.taxizagreb24.com/result-8ckw7w2h3ebt?region=eu"></script>
```

- `cs.js` sends the click-ping first, identifies the device with Fingerprint through this site's
  own proxy on `metrics.taxizagreb24.com` (the two `data-fp-*` attributes), then posts the ingest. It
  keeps the old integration's device token (`cs_device_token`) and `window.__cs*` flags, so a
  returning device stays one device.
- Its Fingerprint key comes from ClickShield (`FINGERPRINT_PUBLIC_API_KEY`), so the
  `NUXT_PUBLIC_FINGERPRINT_*` and `NUXT_PUBLIC_CLICKSHIELD_INGEST_URL` settings below are no longer
  read.
- Debug: open a page with `?cs_debug=1` and read the `[ClickShield]` console lines. Reference:
  ClickShield's `docs/tracker.md`.
- The previous Nuxt integration is parked, not deleted, in
  [`legacy/clickshield-fingerprint/`](legacy/clickshield-fingerprint/), outside `plugins/`, so Nuxt
  no longer registers it. To roll back, revert the commit that moved it there and push `main`.

The section below describes that previous integration.

## How fingerprinting worked before the hosted script

Fingerprint Pro is **not always-on**. The agent loads only when the visit is paid Google Ads
traffic, which keeps the (billed) Fingerprint quota focused on the clicks that matter for fraud
detection. The gates live in [`composables/usePageContext.ts`](composables/usePageContext.ts);
the SSR head boot ([`plugins/fingerprint-early.ts`](plugins/fingerprint-early.ts)) runs them
before Nuxt hydrates, with [`plugins/fingerprint.client.ts`](plugins/fingerprint.client.ts) as
the hydration-time fallback (it never blocks hydration).

An ad landing sends **two** beacons to ClickShield, in this order:

1. **Click-ping** (`POST /api/fingerprint/click`, ~0.2 s after the HTML) — on **every** document
   whose URL carries ad params (`detectAdTraffic()`):
   - a Google Ads **click id**: `gclid`, `wbraid`, or `gbraid` (the value is captured for attribution), **or**
   - the `gad_source` marker, **or**
   - `utm_source=google` with a paid `utm_medium` (`cpc`, `ppc`, `paid`, `paidsearch`, `paid-search`).

   The ping is tagged with the document's `navigationType` (`getNavigationType()`), so
   ClickShield can tell a new ad click from a re-show of the landing page. A back-forward-cache
   restore (no script re-runs) sends a `bfcache` ping from `pageshow`.
2. **Identification** (billed `fp.get`, then `POST /api/fingerprint/ingest`) — only when
   `shouldIdentify()` allows it: a genuine new entry, **not** `back_forward` or `reload`.

A prerendered document (Chrome speculation rules) waits for activation — nothing is sent before
the actual tap.

| Action | Nav type | Click-ping (tag) | Counted as ad click | Fingerprints? |
|---|---|---|---|---|
| Tap Google ad → land | `navigate` | ✅ `navigate` | ✅ | ✅ |
| Chrome prerendered the landing, then the tap | `prerender` (at activation) | ✅ `prerender` | ✅ | ✅ |
| Back to Google → re-tap the same ad (same gclid) | `navigate` | ✅ `navigate` | ✅ (again) | ✅ |
| Click an internal link (params drop) | `navigate` | ❌ | — | ❌ |
| Browser **Back** to the landing (bfcache restore) | `pageshow.persisted` | ✅ `bfcache` | ❌ | ❌ |
| Browser **Back** to the landing (full reload) | `back_forward` | ✅ `back_forward` | ❌ | ❌ |
| Manual reload (F5 / pull-to-refresh) | `reload` | ✅ `reload` | ❌ | ❌ |

Flow once the gate passes:

```
Google ad click (URL has ?gclid=…)
  → Nuxt landing loads → fingerprint.client.ts gate passes
  → Fingerprint agent → fp.get({ tag: page context incl. gclid })
  → POST {CLICKSHIELD_INGEST_URL}/api/fingerprint/ingest { requestId, gclid }
        → ClickShield validates the requestId with the SECRET key (tamper-proof),
          stores the normalized event (smart signals, geo, gclid) in Postgres,
          returns { visitorId }
  → View it in the ClickShield admin dashboard (bot/VPN/incognito, risk score, gclid)
```

The `gclid` is attached to the Fingerprint event `tag` **and** sent in the ingest body so a
fraudulent click can later be tied back to the specific Google Ads click.

## Project structure

```
alen-taxi-zagreb/
├── pages/index.vue        # single landing page (SSR)
├── components/            # Hero, Services, About, FAQ, WhatsApp float, CookieConsent, …
├── composables/
│   ├── usePageContext.ts  # detectAdTraffic() + isFreshNavigation() + the FP tag (path/referrer/utm/gclid/lang)
│   ├── useConsentBanner.ts
│   ├── useContact.ts
│   └── useNavbarScroll.ts · useScrollAnimation.ts · useSmoothScroll.ts
├── plugins/
│   ├── fingerprint.client.ts  # the ad-traffic gate + loads the agent + posts to ClickShield
│   └── gtag.client.ts         # Google Ads gtag (Consent Mode v2)
├── docs/                  # FINGERPRINT_SETUP.md, FINGERPRINT_PHASE_B_CLOUDFLARE.md
├── .github/workflows/deploy.yml
└── nuxt.config.ts
```

## Local development

```bash
cp example.env .env        # example.env holds the real values (gitignored); or fill .env.example
pnpm install               # (if the pnpm shim is broken on your machine: npm install --no-package-lock)
pnpm run dev               # http://localhost:3000
```

With the keys unset the site runs normally — fingerprinting simply no-ops. To exercise the gate
locally, set `NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY` + `NUXT_PUBLIC_CLICKSHIELD_INGEST_URL` and
load the site with an ad param, e.g. `http://localhost:3000/?gclid=TEST123`. A plain
`http://localhost:3000/` should produce **no** `fpjs.io` request.

## Testing the flow

The gate is observable end-to-end in the browser. To see real network calls you need the two public
keys set (locally in `.env`, or just test against the live site) — otherwise the agent no-ops:

```
NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY=AyRoy4mfOeDlCinfWqpx
NUXT_PUBLIC_CLICKSHIELD_INGEST_URL=https://clickshield-web-370434332956.europe-west4.run.app
```

### 1. Watch the right requests

Open **DevTools → Network** and filter by `click` (the instant click-ping), `fpjs` (the
Fingerprint agent/identification) and `ingest` (the POST to ClickShield). To read the navigation type live, run this in the **Console**:

```js
performance.getEntriesByType('navigation')[0].type   // 'navigate' | 'back_forward' | 'reload'
```

### 2. Walk the truth-table scenarios

| # | Steps | Expected |
|---|---|---|
| 1 | Open `…/?gclid=TEST123` in a **new tab** (address bar → Enter) | A `POST /api/fingerprint/click` beacon (tagged `navigate`) leaves first, then the `fpjs.io` request **and** a `POST /api/fingerprint/ingest` |
| 2 | Open `…/` with **no** params | **No** `fpjs.io` and **no** ingest |
| 3 | From scenario 1, click an internal link, then the browser **Back** button | A `click` beacon tagged `back_forward` (or `bfcache`), but **no** new `fpjs`/ingest |
| 4 | From the Google SERP (or any other page), re-click a link to `…/?gclid=TEST123` | Fires **again**, even with the same gclid (nav type `navigate`) |
| 5 | On the ad landing, press **F5** | A `click` beacon tagged `reload`, **no** new `fpjs`/ingest |
| 6 | Open `…/?utm_source=google&utm_medium=cpc` | Fires |
| 7 | Open `…/?utm_source=google&utm_medium=organic` | **No** fire (not a paid medium) |

> Tip: use a **fresh tab** (or incognito window) for scenarios 1/4 so the first load is a clean
> `navigate`. Browser Back is often served from the bfcache: the page JS doesn't re-run, but the
> `pageshow` listener still sends a click beacon tagged `bfcache` (never counted as an ad click).

### 3. Confirm the gclid is forwarded

In scenario 1, click the `ingest` request → **Payload**. It must be:

```json
{ "requestId": "…", "gclid": "TEST123" }
```

(`gad_source`/paid-UTM visits fire too, but carry **no** click id, so `gclid` is absent/null there.)

### 4. Confirm it reached ClickShield

The ingest response body is `{ "visitorId": "…" }` on success (or `{ "visitorId": null, "reason": … }`
if the secret key/origin isn't configured). Then open the **ClickShield admin dashboard** — the visit
appears with its smart signals (bot / VPN / incognito), risk score, and the `gclid`. A `403 Unknown
origin` means this site's domain isn't registered in ClickShield's `FINGERPRINT_SITES` allowlist.

### 5. (Optional) Fingerprint dashboard

In the Fingerprint **Pro** dashboard, the identification event shows the `tag` payload (path,
referrer, utm, **gclid**) — useful to confirm only ad-tagged visits produced events.

## Environment variables

Nuxt maps `NUXT_PUBLIC_*` env vars onto `runtimeConfig.public`. Every variable this site needs is
**public** (safe to expose) — the Fingerprint **secret** key lives in ClickShield, not here.

| Variable | Default | Purpose |
|---|---|---|
| `NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY` | — | Browser agent key — `AyRoy4mfOeDlCinfWqpx` (domain-locked, shared with tim) |
| `NUXT_PUBLIC_FINGERPRINT_REGION` | `eu` | Workspace region (`eu` \| `us` \| `ap`) — must match ClickShield |
| `NUXT_PUBLIC_CLICKSHIELD_INGEST_URL` | — | ClickShield backend origin the browser posts the `requestId`+`gclid` to |
| `NUXT_PUBLIC_GTAG_ID` | `AW-17804137574` | Google Ads gtag / conversion id |
| `NUXT_PUBLIC_FINGERPRINT_ENDPOINT` | — | Optional custom first-party subdomain (Safari ITP) |
| `NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN` | — | Optional custom agent-script URL |

Real values live in **`example.env`** (gitignored, do not commit). **`.env.example`** is the
committed placeholder template.

> This is the **primary Fingerprint Pro workspace**; the sibling `tim-taxi-zagreb` reuses the same
> public key. Both sites send to the same ClickShield backend, where events are separated by tenant
> (`tim` / `alen`) and the dashboard's domain breakdown shows which site each visit came from. See
> [`docs/FINGERPRINT_SETUP.md`](docs/FINGERPRINT_SETUP.md) (Safari first-party subdomain:
> [`docs/FINGERPRINT_PHASE_B_CLOUDFLARE.md`](docs/FINGERPRINT_PHASE_B_CLOUDFLARE.md)).

## Deployment (Cloud Run)

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
(keyless, via Workload Identity Federation) builds the `Dockerfile`, pushes the image to Artifact
Registry, and runs `gcloud run deploy` to **`europe-west4`**. The workflow sets
`NUXT_PUBLIC_CLICKSHIELD_INGEST_URL` and preserves the service's other env vars (the Fingerprint
public key set out-of-band on the service).

Manual deploy (equivalent), if ever needed:

```bash
gcloud run deploy alen-taxi-zagreb \
  --source . \
  --project project-57147346-010b-465c-a23 \
  --region europe-west4 \
  --allow-unauthenticated \
  --update-env-vars 'NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY=AyRoy4mfOeDlCinfWqpx,NUXT_PUBLIC_FINGERPRINT_REGION=eu,NUXT_PUBLIC_CLICKSHIELD_INGEST_URL=https://clickshield-web-370434332956.europe-west4.run.app'
```

> Always deploy to **`europe-west4`** — that's the region the live domain maps to.

## Notes

- **Fingerprinting fires only for paid Google Ads visits** (see [the gate](#how-fingerprinting-works)).
  Device fingerprinting is personal data under GDPR — disclose it in your privacy/cookie notice. To
  additionally make it consent-gated, see the commented line in `plugins/fingerprint.client.ts`.
- **Allowlist:** for the browser agent to run on the live domain, add `https://taxizagreb24.com`
  (and `http://localhost:3000`) to the public key's allowed origins in the Fingerprint dashboard
  (Security → Web).
- **ClickShield origin allowlist:** ClickShield maps the ingest request `Origin` to a tenant, so the
  live domain must be registered there (`FINGERPRINT_SITES`) or the ingest returns `403`.
