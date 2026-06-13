export interface PageContext {
  path: string
  referrer: string | null
  utm: Record<string, string>
  lang: string | null
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

/**
 * Collects lightweight page/traffic context to attach to the Fingerprint `tag`,
 * so each identification event records which page / referrer / campaign it came
 * from. Browser-only (returns empty context during SSR).
 */
export function usePageContext(): PageContext {
  if (import.meta.server || typeof window === 'undefined') {
    return { path: '/', referrer: null, utm: {}, lang: null }
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
  }
}
