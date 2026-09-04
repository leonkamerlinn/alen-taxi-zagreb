# Fingerprint Pro — Phase B: First‑party Cloudflare Worker proxy (1‑year Safari)

This is the runbook for making Fingerprint Pro **first‑party** on `metrics.<domain>` via a
**self‑managed Cloudflare Worker proxy**, so visitor cookies survive in Safari for **~1 year**
instead of the ~7 days you get from a plain CNAME custom subdomain (Safari ITP caps
CNAME‑cloaked / third‑party cookies at 7 days).

> **STATUS: ✅ DEPLOYED (both sites) — 2026‑06‑18.** Deployed via the Cloudflare + Fingerprint
> MCPs as a **self‑managed worker** (not the dashboard wizard). Covers Alen's `taxizagreb24.com`
> **and** Tim's `zagrebtaxizagreb.com` (they share one Fingerprint workspace + public key).

---

## How it works

```
Browser on https://<domain>
   │  loads agent + sends identification to …
   ▼
https://metrics.<domain>/<path>      (proxied / orange‑cloud on Cloudflare)
   │  self‑managed Cloudflare Worker (fingerprintjs/cloudflare-worker-proxy v1.7.0)
   ▼
Fingerprint EU APIs (eu.api.fpjs.io)
```

Because the Worker answers as `metrics.<domain>` (same registrable domain as the page), Safari
treats its `Set-Cookie` as first‑party and does **not** apply the 7‑day cap. The app needs no
code change — `plugins/fingerprint.client.ts` already passes `endpoint` + `scriptUrlPattern`
to `load()` when the two `NUXT_PUBLIC_FINGERPRINT_*` env vars are set.

---

## Deployed configuration (live)

| Item | Value |
|---|---|
| Cloudflare account | `e0dd3f3366394663f4d18c175c203c89` |
| Worker source | `fingerprintjs/cloudflare-worker-proxy` **v1.7.0** (`fingerprintjs-pro-cloudflare-worker.esm.js`, SHA‑256 `39091f3b…79c8f6`) |
| Fingerprint region | **EU** (`eu.api.fpjs.io`) |
| Public API key | `AyRoy4mfOeDlCinfWqpx` (shared by both sites) |
| Proxy secret (Fingerprint) | key `cloudflare-proxy-secret`, id `tok_H6UeFHarsRIcIlXTzQeow0RK` (token lives only in each Worker's `PROXY_SECRET` secret binding) |

**Worker env bindings (both workers):**

| Binding | Type | Value |
|---|---|---|
| `AGENT_SCRIPT_DOWNLOAD_PATH` | plain_text | per‑site slug (below) |
| `GET_RESULT_PATH` | plain_text | per‑site slug (below) |
| `INTEGRATION_PATH_DEPTH` | plain_text | `0` (worker served at subdomain root — **default 1 would strip the path segment and break routing**) |
| `FPJS_INGRESS_BASE_HOST` | plain_text | `api.fpjs.io` (the worker prepends `eu.` itself from `?region=eu`; do **not** set `eu.api.fpjs.io`) |
| `PROXY_SECRET` | secret_text | the proxy key token above |

**Per‑site:**

| | Alen | Tim |
|---|---|---|
| Domain | `taxizagreb24.com` | `zagrebtaxizagreb.com` |
| Subdomain | `metrics.taxizagreb24.com` | `metrics.zagrebtaxizagreb.com` |
| CF zone | `d01a0487ebc5137e39ff6ad638230dcc` | `5a2835517257af93e303c33e1f6728ac` |
| Worker script | `fingerprint-proxy-alen` | `fingerprint-proxy-tim` |
| Route | `metrics.taxizagreb24.com/*` (`7a60bf70…`) | `metrics.zagrebtaxizagreb.com/*` (`c4599d0e…`) |
| `AGENT_SCRIPT_DOWNLOAD_PATH` | `agent-m0zfpmtcwbpc` | `agent-fyatwbypklm5` |
| `GET_RESULT_PATH` | `result-8ckw7w2h3ebt` | `result-wrpuw4ou4zff` |
| DNS `metrics` AAAA `100::` proxied | pre‑existing | created 2026‑06‑18 |
| Cloud Run service | `alen-taxi-zagreb` | `tim-taxi-zagreb-new` |
| Revision with env vars | `alen-taxi-zagreb-00006-crt` | `tim-taxi-zagreb-new-00004-d7n` |

**Cloud Run env vars set (per site):**

```
NUXT_PUBLIC_FINGERPRINT_ENDPOINT=https://metrics.<domain>/<GET_RESULT_PATH>?region=eu
NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN=https://metrics.<domain>/<AGENT_SCRIPT_DOWNLOAD_PATH>?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>
```

> `<apiKey>`, `<version>`, `<loaderVersion>` are **literal placeholders** the FingerprintJS
> agent substitutes at runtime — the worker reads them from the query string and builds the
> `…/web/v<version>/<apiKey>/loader_v<loaderVersion>.js` CDN path itself.

---

## How it was deployed (self‑managed, via MCP)

1. **Proxy secret** — Fingerprint MCP `create_api_key` `type:proxy` → token → `PROXY_SECRET`.
2. **Workers** — `PUT /accounts/<acct>/workers/scripts/<name>` (module worker, multipart with
   the v1.7.0 `.esm.js` as `main_module` + the 5 bindings) for each site, via Cloudflare MCP
   `execute`. (The MCP sandbox egress is allowlisted to `api.cloudflare.com`, so the bundle was
   transferred inline as gzip+base64 and SHA‑256‑verified before upload.)
3. **DNS + routes** — created Tim's proxied `AAAA metrics → 100::` (Alen's already existed) and
   bound both `metrics.<domain>/*` routes.
4. **Cloud Run** — `gcloud run services update <svc> --update-env-vars '^@^…'` (new revision,
   no rebuild — only env vars changed).

### Re‑deploying / updating the worker
To bump the agent‑proxy version later, download the new `*.esm.js` from the repo releases and
re‑`PUT` the same script name with the same bindings. Routes/DNS/Cloud Run stay as‑is.

---

## Verify

```bash
# 1. metrics resolves to CLOUDFLARE IPs (104.x / 172.6x), i.e. proxied — not Google 216.239.x
dig +short metrics.taxizagreb24.com
dig +short metrics.zagrebtaxizagreb.com

# 2. Worker answers + all env vars valid (status page shows "Worker version: 1.7.0")
curl -s https://metrics.taxizagreb24.com/status | grep -i "worker version\|variables are set"

# 3. Agent proxies first‑party (200, text/javascript, ~169 KB)
curl -sI "https://metrics.taxizagreb24.com/agent-m0zfpmtcwbpc?apiKey=AyRoy4mfOeDlCinfWqpx&version=3" | head -1

# 4. Site payload points the agent at metrics.* (no fpjscdn)
curl -s https://taxizagreb24.com/ | grep -o 'metrics\.taxizagreb24\.com/[a-z-]*[a-z0-9]*'
```

In **Safari** on each site, DevTools → Network: agent loads from `metrics.<domain>/…` (not
`fpjscdn.net`); `POST /api/identify` → `200 {"ok":true}`; the Fingerprint visitor cookie's
`Expires` should be ≈ +1 year (vs ~7 days previously). Events: Fingerprint MCP `search_events`
(EU) shows fresh events after a visit. ✅ All of 1–4 verified at deploy time.

---

## ⚠️ Remaining manual step — lock the public key origins

The Fingerprint **MCP/management API does not expose allowed‑origin restrictions**, so this must
be done in the **dashboard**: App settings → API Keys → the **public** key (`AyRoy4mfOeDlCinfWqpx`)
→ allowed origins → restrict to `https://taxizagreb24.com`, `https://metrics.taxizagreb24.com`,
`https://zagrebtaxizagreb.com`, `https://metrics.zagrebtaxizagreb.com` (+ `http://localhost:3000`
if local dev needs it). This prevents quota abuse from other sites; it is hardening, not required
for cookie longevity.

---

## Rollback

Per site, remove the two env vars (tracking falls back to the CDN, still works):

```bash
gcloud run services update <svc> --region europe-west4 \
  --project project-57147346-010b-465c-a23 \
  --remove-env-vars NUXT_PUBLIC_FINGERPRINT_ENDPOINT,NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN
```

The Workers, routes, and `metrics` DNS records can stay (inert once the env vars are gone) or be
deleted via the Cloudflare MCP / dashboard.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Agent still loads from `fpjscdn.net` | Env vars not applied. Check `gcloud run services describe <svc> --region europe-west4 --format='value(spec.template.spec.containers[0].env)'`. |
| `metrics` resolves to `216.239.x` (Google) | DNS record is **DNS‑only (grey)**. Turn the proxy **ON** (orange). |
| Status page lists a var "not set" / `5xx` | A binding is missing/invalid — re‑`PUT` the worker with all 5 bindings; `INTEGRATION_PATH_DEPTH` must be `0`. |
| `404 {"error":"unmatched path …"}` from the worker | Request path doesn't match `AGENT_SCRIPT_DOWNLOAD_PATH`/`GET_RESULT_PATH`, or `INTEGRATION_PATH_DEPTH` ≠ `0` for a subdomain‑root deploy. |
| Double‑prefixed ingress host (`eu.eu.api.fpjs.io`) | `FPJS_INGRESS_BASE_HOST` was set to `eu.api.fpjs.io`; it must be the base `api.fpjs.io`. |
| Safari still drops cookies after ~7 days | `metrics` not actually proxied, or env vars not live — re‑verify steps 1–4. |

> **CSP note:** this app currently sends **no Content‑Security‑Policy**. If one is ever added,
> include `https://metrics.<domain>` in `connect-src` **and** `script-src`.
