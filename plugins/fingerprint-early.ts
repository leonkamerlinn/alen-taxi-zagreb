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
    const preconnectHref = endpoint || 'https://fpjscdn.net'

    const script = buildEarlyFingerprintScript({
      apiKey,
      region: (pub.fingerprintRegion as string) || 'eu',
      endpoint,
      scriptUrlPattern: (pub.fingerprintScriptUrlPattern as string) || '',
      ingestUrl: (pub.clickshieldIngestUrl as string) || '',
    })

    useHead({
      link: [
        { key: 'cs-fp-preconnect', rel: 'preconnect', href: preconnectHref, crossorigin: 'anonymous' },
        { key: 'cs-fp-dns', rel: 'dns-prefetch', href: preconnectHref },
      ],
      script: [
        {
          key: 'cs-fp-early',
          type: 'text/javascript',
          tagPosition: 'head',
          // Unhead serializes innerHTML into the SSR HTML <script> body.
          innerHTML: script,
        },
      ],
    })
  },
})
