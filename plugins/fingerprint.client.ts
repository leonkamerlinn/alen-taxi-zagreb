import { load } from '@fingerprintjs/fingerprintjs-pro'
import {
  detectAdTraffic,
  getNavigationType,
  shouldIdentify,
  usePageContext,
  type NavigationType,
} from '~/composables/usePageContext'
import { getOrCreateDeviceToken, postClickPing, postIngest } from '~/utils/fingerprint-ingest'

declare global {
  interface Window {
    /** Set by the inline head boot the moment it runs (single-shot guard). */
    __csFpBoot?: 1
    /** Set once this document's click-ping left (either path — never double-ping). */
    __csClickPinged?: 1
    /** Set by plugins/fingerprint-early.ts inline head boot (identify + ingest). */
    __csFpPromise?: Promise<{ requestId: string } | null>
  }
}

// Fire once per full page load (module-level guard; this is a single-page site).
let identified = false

/**
 * Hydration-time FALLBACK for the SSR head boot (plugins/fingerprint-early.ts).
 * When the inline script ran, it owns this document and this plugin does
 * nothing — in particular it never awaits `window.__csFpPromise`: Nuxt awaits
 * plugins before mounting, so that would hold hydration until identification
 * finished (up to the agent timeout). Otherwise it runs the same two stages
 * with the same gates.
 */
export default defineNuxtPlugin({
  name: 'fingerprint',
  setup() {
    const { public: pub } = useRuntimeConfig()
    const apiKey = pub.fingerprintPublicApiKey as string

    // Not configured yet → do nothing (site keeps working).
    if (!apiKey || typeof window === 'undefined') return
    if (window.__csFpBoot || window.__csFpPromise) return

    // GOOGLE-ADS-ONLY. Only paid Google Ads visits (gclid/wbraid/gbraid,
    // gad_source, or a paid Google UTM) — saves quota on organic/direct traffic
    // and focuses events on the clicks that matter for click-fraud analysis.
    const params = new URLSearchParams(window.location.search)
    if (!detectAdTraffic(params).isAd) return

    // To also make fingerprinting GDPR consent-gated, add (before this line):
    // if (localStorage.getItem('cookie-consent') !== 'accepted') return

    const ingestUrl = pub.clickshieldIngestUrl as string
    const ctx = usePageContext()
    const deviceToken = getOrCreateDeviceToken()
    const ping = (navigationType: NavigationType | 'bfcache') =>
      postClickPing(ingestUrl, {
        gclid: ctx.gclid,
        deviceToken,
        path: ctx.path,
        referrer: ctx.referrer,
        lang: ctx.lang,
        navigationType,
      })

    async function identify(): Promise<void> {
      try {
        const options: Record<string, unknown> = {
          apiKey,
          region: (pub.fingerprintRegion as string) || 'eu',
        }
        // First-party custom subdomain (Safari ITP) — only when configured.
        if (pub.fingerprintEndpoint) options.endpoint = pub.fingerprintEndpoint
        if (pub.fingerprintScriptUrlPattern) options.scriptUrlPattern = pub.fingerprintScriptUrlPattern

        const fp = await load(options as any)
        // Traffic context on the event; a 5s budget suits a mobile ad landing.
        const result = await fp.get({ tag: ctx, linkedId: deviceToken, timeout: 5000 })
        postIngest(ingestUrl, { requestId: result.requestId, gclid: ctx.gclid })
      } catch (err) {
        // Agent blocked (ad-blocker / privacy extension) or offline — fail silently.
        if (import.meta.dev) console.warn('[fingerprint] init failed:', err)
      }
    }

    const run = (prerendered: boolean) => {
      const navigationType: NavigationType = prerendered ? 'prerender' : getNavigationType()
      // 1. Instant click-ping — every ad-marked document, before any gate, plus
      //    a `bfcache` ping when the browser restores this document later.
      if (!window.__csClickPinged) {
        window.__csClickPinged = 1
        ping(navigationType)
        window.addEventListener('pageshow', (e) => {
          if (e.persisted) ping('bfcache')
        })
      }
      // 2. Identification — billed, so only on a genuine new entry. Fire and
      //    forget: hydration must not wait for it.
      if (!shouldIdentify(navigationType) || identified) return
      identified = true
      void identify()
    }

    // A prerendered document (Chrome speculation rules) has not been tapped
    // yet — wait for activation so no ping and no billed identify precede the click.
    const doc = document as Document & { prerendering?: boolean }
    if (doc.prerendering) {
      document.addEventListener('prerenderingchange', () => run(true), { once: true })
    } else {
      run(false)
    }
  },
})
