export interface PageContext {
  path: string
  referrer: string | null
  utm: Record<string, string>
  lang: string | null
  /** Google Ads click id (gclid/wbraid/gbraid), if this visit came from an ad. */
  gclid: string | null
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

// A real Google Ads click id (any one of these proves an ad click).
const CLICK_ID_KEYS = ['gclid', 'wbraid', 'gbraid'] as const
// Paid mediums we accept alongside utm_source=google (manually-tagged ad links).
const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paidsearch', 'paid-search']

/**
 * Decide whether this visit is paid Google Ads traffic and, if so, surface the
 * click id. Fires on a real click id (gclid/wbraid/gbraid), the `gad_source`
 * marker, or `utm_source=google` with a paid `utm_medium`. Pure over the params.
 */
export function detectAdTraffic(params: URLSearchParams): { isAd: boolean; clickId: string | null } {
  for (const key of CLICK_ID_KEYS) {
    const value = params.get(key)
    if (value) return { isAd: true, clickId: value }
  }
  if (params.get('gad_source')) return { isAd: true, clickId: null }

  const source = (params.get('utm_source') || '').toLowerCase()
  const medium = (params.get('utm_medium') || '').toLowerCase()
  if (source === 'google' && PAID_MEDIUMS.includes(medium)) return { isAd: true, clickId: null }

  return { isAd: false, clickId: null }
}

/**
 * How the current document came to be. Sent with every click-ping so ClickShield
 * can tell a new ad click from a re-show of the landing page:
 *  - `navigate`     — a genuine new history entry (the ad tap)
 *  - `prerender`    — Chrome prerendered the page; reported at activation
 *  - `back_forward` — the visitor came Back/Forward onto the landing
 *  - `reload`       — F5 / pull-to-refresh
 *  - `unknown`      — Navigation Timing unavailable (treated as a fresh click)
 * A bfcache restore never re-runs scripts; it is reported as `bfcache` from the
 * `pageshow` listener instead.
 */
export type NavigationType = 'navigate' | 'prerender' | 'back_forward' | 'reload' | 'unknown'

/** Detect the document's navigation type. Never throws. */
export function getNavigationType(): NavigationType {
  try {
    const doc = typeof document === 'undefined' ? null : (document as Document & { prerendering?: boolean })
    if (doc?.prerendering) return 'prerender'
    if (typeof performance === 'undefined' || !performance.getEntriesByType) return 'unknown'
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const type = nav?.type
    return type === 'navigate' || type === 'back_forward' || type === 'reload' ? type : 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Identification (a billed `fp.get`) runs only for a genuine new entry — NOT a
 * back/forward traversal or a reload, which re-show a landing the device was
 * already identified on. The click-ping is NOT gated by this: it fires on every
 * ad-marked document and carries the type. Fails open on `unknown`.
 */
export function shouldIdentify(type: NavigationType): boolean {
  return type !== 'back_forward' && type !== 'reload'
}

/** `shouldIdentify(getNavigationType())` — kept for readability at call sites. */
export function isFreshNavigation(): boolean {
  return shouldIdentify(getNavigationType())
}

/**
 * Collects lightweight page/traffic context to attach to the Fingerprint `tag`,
 * so each identification event records which page / referrer / campaign it came
 * from. Browser-only (returns empty context during SSR).
 */
export function usePageContext(): PageContext {
  if (import.meta.server || typeof window === 'undefined') {
    return { path: '/', referrer: null, utm: {}, lang: null, gclid: null }
  }

  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) utm[key.replace('utm_', '')] = value
  }

  return {
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || null,
    utm,
    lang: navigator.language || null,
    gclid: detectAdTraffic(params).clickId,
  }
}
