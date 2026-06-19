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
 * True only for a fresh top-level navigation (`type === 'navigate'`) — i.e. NOT
 * a back/forward traversal or a reload. This is what keeps fingerprinting from
 * re-firing when the visitor hits Back and the ad params reappear in the URL,
 * while still firing on a genuine re-click of a cached ad. Fails open (returns
 * true) if the Navigation Timing entry is unavailable.
 */
export function isFreshNavigation(): boolean {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return true
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  return nav ? nav.type === 'navigate' : true
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
