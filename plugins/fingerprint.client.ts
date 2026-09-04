import { load } from '@fingerprintjs/fingerprintjs-pro'
import { postClickPing, postIngest } from '~/utils/fingerprint-ingest'

declare global {
  interface Window {
    /** Set by plugins/fingerprint-early.ts inline head boot (identify + ingest). */
    __csFpPromise?: Promise<{ requestId: string } | null>
  }
}

// Fire once per full page load (module-level guard; this is a single-page site).
let identified = false

const DEVICE_TOKEN_KEY = 'cs_device_token'

/** First-party persistent id — survives Fingerprint visitorId rotation on iOS. */
function getOrCreateDeviceToken(): string {
  try {
    let token = localStorage.getItem(DEVICE_TOKEN_KEY)
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem(DEVICE_TOKEN_KEY, token)
    }
    return token
  } catch {
    return crypto.randomUUID()
  }
}

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()
  const apiKey = pub.fingerprintPublicApiKey as string

  // Not configured yet → do nothing (site keeps working).
  if (!apiKey) return

  // Early head boot already started (or finished) identify + ingest — reuse it.
  if (typeof window !== 'undefined' && window.__csFpPromise) {
    try {
      await window.__csFpPromise
    } catch {
      // Early boot failed; do not double-fire a fallback on the same load.
    }
    return
  }

  // GOOGLE-ADS-ONLY. Fingerprint only paid Google Ads visits — saves quota on
  // organic/direct traffic and focuses events on the clicks that matter for
  // click-fraud analysis. The gate requires both:
  //   1. ad params in the URL (gclid/wbraid/gbraid/gad_source or paid Google UTM)
  //   2. a fresh navigation — NOT a back/forward or reload. This stops a re-fire
  //      when the visitor hits Back and the ad params reappear, while still
  //      firing on a genuine re-click of a cached ad.
  const params = new URLSearchParams(window.location.search)
  if (!detectAdTraffic(params).isAd || !isFreshNavigation()) return

  // To also make fingerprinting GDPR consent-gated, add (before this line):
  // if (localStorage.getItem('cookie-consent') !== 'accepted') return

  if (identified) return
  identified = true

  // Instant click-ping BEFORE the agent loads — mirrors the early head boot so
  // the ad click is registered (~0.2s) even when this fallback path is the one
  // that runs and the visitor bounces before identification finishes.
  const ctx = usePageContext()
  const deviceToken = getOrCreateDeviceToken()
  postClickPing(pub.clickshieldIngestUrl as string, {
    gclid: ctx.gclid,
    deviceToken,
    path: ctx.path,
    referrer: ctx.referrer,
    lang: ctx.lang,
  })

  try {
    const options: Record<string, unknown> = {
      apiKey,
      region: (pub.fingerprintRegion as string) || 'eu',
    }
    // First-party custom subdomain (Safari ITP) — only when configured.
    if (pub.fingerprintEndpoint) options.endpoint = pub.fingerprintEndpoint
    if (pub.fingerprintScriptUrlPattern) options.scriptUrlPattern = pub.fingerprintScriptUrlPattern

    const fp = await load(options as any)

    // Attach traffic context so the event records which page/campaign it came from.
    const result = await fp.get({ tag: ctx, linkedId: deviceToken })

    // Beacon / keepalive so a fast bounce still delivers the requestId.
    postIngest(pub.clickshieldIngestUrl as string, {
      requestId: result.requestId,
      gclid: ctx.gclid,
    })
  } catch (err) {
    // Agent blocked (ad-blocker / privacy extension) or offline — fail silently.
    if (import.meta.dev) console.warn('[fingerprint] init failed:', err)
  }
})
