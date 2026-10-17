import { detectAdTraffic } from '~/composables/usePageContext'
import { buildEarlyFingerprintScript } from '~/utils/fingerprint-early-script'

/**
 * SSR (and client) head injection: start Fingerprint as soon as HTML is parsed
 * for paid Google Ads landings, so sub-1s bounces can still finish identify +
 * ingest before Nuxt hydrates. The classic plugin reuses window.__csFpPromise.
 */
export default defineNuxtPlugin({
  name: 'fingerprint-early',
  enforce: 'pre',
  setup() {
    const { public: pub } = useRuntimeConfig()
    const apiKey = (pub.fingerprintPublicApiKey as string) || ''
    if (!apiKey) return

    let search = ''
    if (import.meta.server) {
      try {
        search = useRequestURL().search
      } catch {
        return
      }
    } else if (typeof window !== 'undefined') {
      search = window.location.search
    }

    if (!detectAdTraffic(new URLSearchParams(search)).isAd) return

    const endpoint = (pub.fingerprintEndpoint as string) || ''
    const region = (pub.fingerprintRegion as string) || 'eu'
    const scriptUrlPattern = (pub.fingerprintScriptUrlPattern as string) || ''

    // BOTH hosts on the critical path get a warm connection during HTML parse:
    // the agent download (script CDN) AND the identify API. Covering only one
    // leaves the other paying DNS+TCP+TLS (~100-300ms) right when it matters.
    // The inline boot always import()s the agent from fpjscdn.net (a custom
    // scriptUrlPattern only affects the agent's own later loads), so that is
    // the host to warm and the module to preload — regardless of the pattern.
    const scriptHost = 'https://fpjscdn.net'
    const apiHost =
      endpoint || (region === 'us' ? 'https://api.fpjs.io' : `https://${region}.api.fpjs.io`)

    // The exact module the inline boot will import() — a modulepreload starts
    // its download during HTML parse, before the script even executes.
    const agentModuleUrl = `https://fpjscdn.net/v3/${encodeURIComponent(apiKey)}`

    const script = buildEarlyFingerprintScript({
      apiKey,
      region,
      endpoint,
      scriptUrlPattern,
      ingestUrl: (pub.clickshieldIngestUrl as string) || '',
    })

    // tagPriority 'critical' renders these before the app stylesheets — an
    // inline script otherwise blocks on every earlier stylesheet (CSSOM), which
    // costs the exact hundreds of ms this boot exists to save.
    useHead({
      link: [
        { key: 'cs-fp-preconnect-script', rel: 'preconnect', href: scriptHost, crossorigin: 'anonymous', tagPriority: 'critical' },
        { key: 'cs-fp-preconnect-api', rel: 'preconnect', href: apiHost, crossorigin: 'anonymous', tagPriority: 'critical' },
        { key: 'cs-fp-dns-script', rel: 'dns-prefetch', href: scriptHost, tagPriority: 'critical' },
        { key: 'cs-fp-dns-api', rel: 'dns-prefetch', href: apiHost, tagPriority: 'critical' },
        // No crossorigin: module import() uses credentials mode "same-origin";
        // a mismatched preload credentials mode would double-fetch the agent.
        { key: 'cs-fp-modulepreload', rel: 'modulepreload', href: agentModuleUrl, tagPriority: 'critical' },
      ],
      script: [
        {
          key: 'cs-fp-early',
          type: 'text/javascript',
          tagPosition: 'head',
          tagPriority: 'critical',
          // Unhead serializes innerHTML into the SSR HTML <script> body.
          innerHTML: script,
        },
      ],
    })
  },
})
