export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gtagId = config.public.gtagId as string

  if (!gtagId) return

  window.dataLayer = window.dataLayer || []
  function gtag(..._args: any[]) {
    // gtag.js expects the Arguments object, not a spread array
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag

  const consent = localStorage.getItem('cookie-consent')

  // Consent Mode v2: deny storage until the visitor explicitly accepts
  gtag('consent', 'default', {
    ad_storage: consent === 'accepted' ? 'granted' : 'denied',
    ad_user_data: consent === 'accepted' ? 'granted' : 'denied',
    ad_personalization: consent === 'accepted' ? 'granted' : 'denied',
    analytics_storage: consent === 'accepted' ? 'granted' : 'denied',
  })

  if (consent === 'declined') {
    ;(window as any)[`ga-disable-${gtagId}`] = true
  }

  gtag('js', new Date())
  gtag('config', gtagId)
})

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}
