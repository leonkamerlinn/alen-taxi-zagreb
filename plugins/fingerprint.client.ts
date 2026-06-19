import { load } from '@fingerprintjs/fingerprintjs-pro'

// Fire once per full page load (module-level guard; this is a single-page site).
let identified = false

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()
  const apiKey = pub.fingerprintPublicApiKey as string

  // Not configured yet → do nothing (site keeps working).
  if (!apiKey) return

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
    const ctx = usePageContext()
    const result = await fp.get({ tag: ctx })

    // Send the requestId straight to the ClickShield backend (cross-origin). It
    // validates it server-side with the Secret API key, persists the event, and
    // recognises returning visitors — this site has no fingerprint backend. The
    // gclid is forwarded so a fraudulent click can be tied back to the ad click.
    const ingestUrl = pub.clickshieldIngestUrl as string
    if (ingestUrl) {
      await fetch(`${ingestUrl}/api/fingerprint/ingest`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ requestId: result.requestId, gclid: ctx.gclid }),
      }).catch(() => {})
    }
  } catch (err) {
    // Agent blocked (ad-blocker / privacy extension) or offline — fail silently.
    if (import.meta.dev) console.warn('[fingerprint] init failed:', err)
  }
})
