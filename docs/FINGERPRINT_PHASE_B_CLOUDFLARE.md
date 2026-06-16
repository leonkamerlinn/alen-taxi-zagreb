# Fingerprint Pro — Phase B: First‑party Cloudflare Worker proxy (1‑year Safari)

This is the runbook for making Fingerprint Pro **first‑party** on `metrics.taxizagreb24.com` via
Fingerprint's **Cloudflare Worker proxy integration**, so visitor cookies survive in Safari for **~1 year**
instead of the ~7 days you get from a plain CNAME custom subdomain.

> **Phase A is already done.** Tracking + the `/dashboard` admin UI are live on `taxizagreb24.com` (EU region),
> loading the agent from Fingerprint's CDN. Phase B is an optional upgrade — leaving it undone changes nothing
> except reduced Safari cookie longevity. See [`FINGERPRINT_SETUP.md`](./FINGERPRINT_SETUP.md) for Phase A.

---

## Why this approach

| | CNAME custom subdomain | **Cloudflare Worker proxy (this doc)** |
|---|---|---|
| First‑party script + API | ✅ | ✅ |
| Safari cookie lifetime | ~7 days (ITP caps CNAME‑cloaked cookies) | **~1 year** (responses come first‑party from your Worker) |
| Setup | DNS records only | DNS record + dashboard wizard deploys a Worker |

We use the **DNS‑only subdomain variant**: the apex `taxizagreb24.com` stays **DNS‑only** (its serving path is
unchanged), and **only `metrics.taxizagreb24.com` is proxied** through Cloudflare to run the Worker.

### Architecture

```
Browser on https://taxizagreb24.com
   │  loads agent + sends identification to …
   ▼
https://metrics.taxizagreb24.com/<WORKER_PATH>      (proxied / orange‑cloud on Cloudflare)
   │  Cloudflare Worker (deployed by the Fingerprint wizard)
   ▼
Fingerprint EU APIs (eu.api.fpjs.io, fpjscdn.net)
```

Because the Worker answers as `metrics.taxizagreb24.com` (same registrable domain as the page), Safari treats
its cookies as first‑party and does not apply the 7‑day CNAME cap.

---

## Facts for this project

| Item | Value |
|---|---|
| Live domain | `taxizagreb24.com` |
| Subdomain | `metrics.taxizagreb24.com` |
| DNS provider | **Cloudflare** (zone id `d01a0487ebc5137e39ff6ad638230dcc`, account `e0dd3f…`) |
| Cloud Run service | `alen-taxi-zagreb`, region **`europe-west4`**, project `project-57147346-010b-465c-a23` |
| Fingerprint region | **EU** (`eu.api.fpjs.io`) |
| Public API key | `AyRoy4mfOeDlCinfWqpx` |
| Env vars to set | `NUXT_PUBLIC_FINGERPRINT_ENDPOINT`, `NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN` |

The app code already reads those two env vars (`plugins/fingerprint.client.ts`) — **no code change is needed**,
only config + the Cloudflare wizard + a redeploy.

---

## Prerequisites

- A **Cloudflare API token** for the wizard, scoped to:
  - **Account → Workers Scripts → Edit**
  - **Zone → Workers Routes → Edit** (zone `taxizagreb24.com`)
  - Recommended: **IP filter `3.23.16.20`** (Fingerprint's wizard backend), **no TTL**.
  - *(The token `cfat_1yy…` already validated for these Workers scopes. It lacks `Zone:DNS:Edit`, which is fine —
    you add the one DNS record manually in Step 2.)*
- **Workers enabled** on the Cloudflare account (free tier is enough).

---

## Steps

### Step 1 — Add the proxied subdomain record (Cloudflare)

Cloudflare → `taxizagreb24.com` → **DNS → Records → Add record**:

| Field | Value |
|---|---|
| Type | `AAAA` |
| Name | `metrics` |
| IPv6 address | `100::` |
| Proxy status | **Proxied (orange cloud) — ON** |

`100::` is a discard placeholder; the Worker serves every response, so the address is never contacted. The
record's only job is to route `metrics.taxizagreb24.com` through Cloudflare's edge so the Worker route fires.
**It must be proxied (orange), not DNS‑only (grey).**

### Step 2 — Run the Fingerprint Cloudflare wizard

Fingerprint dashboard → **SDKs & integrations → Cloudflare → Connect** →

1. Choose the **subdomain** integration option.
2. Target subdomain: `metrics.taxizagreb24.com`.
3. Paste the Cloudflare API token from Prerequisites.
4. Finish — the wizard deploys a Worker (named `fingerprint-pro-cloudflare-worker-<id>`), creates a **proxy
   secret**, and binds the route.

When it completes it shows two values — copy them **exactly**:
- **`endpoint`** → e.g. `https://metrics.taxizagreb24.com/<WORKER_PATH>?region=eu`
- **`scriptUrlPattern`** → e.g. `https://metrics.taxizagreb24.com/<WORKER_PATH>/...`

### Step 3 — Set the env vars + redeploy

Run from the repo root. `--update-env-vars` adds just these two and leaves the existing public vars and
mounted secrets untouched:

```bash
gcloud run deploy alen-taxi-zagreb \
  --source . \
  --region europe-west4 \
  --project project-57147346-010b-465c-a23 \
  --update-env-vars '^@^NUXT_PUBLIC_FINGERPRINT_ENDPOINT=<ENDPOINT_FROM_WIZARD>@NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN=<SCRIPTURLPATTERN_FROM_WIZARD>'
```

> The `^@^` prefix sets `@` as the delimiter so commas inside the URL values are not misread as separators.
> If neither value contains a comma you can drop `^@^` and separate the two assignments with a comma.

### Step 4 — Lock the public key (Fingerprint dashboard)

App settings → API Keys → the **public** key → allowed origins: restrict to
`https://taxizagreb24.com` and `https://metrics.taxizagreb24.com`.

---

## Verify

```bash
# 1. metrics resolves to CLOUDFLARE IPs (104.x / 172.6x), i.e. proxied — not Google 216.239.x
dig +short metrics.taxizagreb24.com

# 2. The Worker answers on the subdomain
curl -sI "https://metrics.taxizagreb24.com/<WORKER_PATH>" | head -1

# 3. Events still flow (EU Server API) after a real browser visit
curl -s -H "Auth-API-Key: <FINGERPRINT_SECRET_KEY>" "https://eu.api.fpjs.io/events/search?limit=1"
```

In a browser on `https://taxizagreb24.com`, open DevTools → Network and confirm:
- the agent script loads from **`metrics.taxizagreb24.com/...`** (not `fpjscdn.net`),
- `POST /api/identify` returns `200 {"ok":true}`,
- the Fingerprint dashboard shows the Cloudflare integration **Connected**.

---

## Rollback

Phase B is purely additive and instantly reversible. To revert to the CDN endpoint (tracking keeps working):

```bash
gcloud run deploy alen-taxi-zagreb --source . --region europe-west4 \
  --project project-57147346-010b-465c-a23 \
  --remove-env-vars NUXT_PUBLIC_FINGERPRINT_ENDPOINT,NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN
```

Or roll traffic back to the previous revision instantly:

```bash
gcloud run services update-traffic alen-taxi-zagreb --region europe-west4 \
  --to-revisions <PREVIOUS_REVISION>=100
```

(You can leave the Cloudflare Worker and `metrics` record in place; they're inert once the env vars are gone.)

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Agent still loads from `fpjscdn.net` | Env vars not applied or mistyped. Check: `gcloud run services describe alen-taxi-zagreb --region europe-west4 --format='value(spec.template.spec.containers[0].env)'`. |
| `metrics` resolves to `216.239.x` (Google) | The DNS record is **DNS‑only (grey)**. Turn the proxy **ON** (orange). |
| `5xx` / no response from `metrics.taxizagreb24.com` | Worker not deployed or route not bound — re‑run the wizard; confirm the `metrics` record is proxied. |
| Wizard fails with a token/permission error | Token needs **Workers Scripts:Edit** + **Workers Routes:Edit** (+ IP filter `3.23.16.20`), and Workers must be enabled on the account. |
| Safari still drops cookies after ~7 days | You used the **CNAME** subdomain, not the **Worker** integration. Re‑do via the wizard (Worker proxy). |
| `POST /api/identify` returns `{ok:false}` | Region mismatch or the requestId wasn't found — confirm `NUXT_PUBLIC_FINGERPRINT_REGION=eu` and the secret key. |

> **CSP note:** this app currently sends **no Content‑Security‑Policy**, so nothing blocks the subdomain. If a
> CSP is ever added, include `https://metrics.taxizagreb24.com` in `connect-src` **and** `script-src`.

---

## Security & GDPR

- After Step 4 the public key is restricted to your two origins, preventing quota abuse from other sites.
- The Fingerprint Cloudflare Worker drops cookies coming from the origin website (per Fingerprint), keeping the
  identification channel clean.
- **GDPR:** the agent runs for **every** visitor (always‑on). Your privacy/cookie notice must disclose device
  fingerprinting. To make it consent‑gated, uncomment the single guard line in `plugins/fingerprint.client.ts`.
- **Rotate** the Fingerprint **secret key** and the **Cloudflare token** after setup if they were shared in
  plaintext, and revoke any unused credentials (e.g. R2 keys).

---

## Optional hardening — endpoint fallback

`plugins/fingerprint.client.ts` currently passes the custom `endpoint`/`scriptUrlPattern` as single values. For
resilience you can pass them as arrays with Fingerprint's defaults appended, so identification still succeeds if
the Worker is ever unavailable (at the cost of falling back to the third‑party CDN for that request). Ask if you
want this wired in alongside the Phase B redeploy.
