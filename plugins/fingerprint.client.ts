import { load } from '@fingerprintjs/fingerprintjs-pro'

// Fire once per full page load (module-level guard; this is a single-page site).
let identified = false

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()
  const apiKey = pub.fingerprintPublicApiKey as string

  // Not configured yet → do nothing (site keeps working).
  if (!apiKey) return

  // ALWAYS-ON (chosen). To make fingerprinting GDPR consent-gated instead,
  // uncomment the next line so it only runs after the visitor accepts cookies:
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
    const result = await fp.get({ tag: usePageContext() })

    // Hand the requestId to our backend for authoritative, tamper-proof validation.
    await $fetch('/api/identify', {
      method: 'POST',
      body: { requestId: result.requestId },
    }).catch(() => {})
  } catch (err) {
    // Agent blocked (ad-blocker / privacy extension) or offline — fail silently.
    if (import.meta.dev) console.warn('[fingerprint] init failed:', err)
  }
})
