export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gtagId = config.public.gtagId as string

  if (!gtagId) return

  const consent = localStorage.getItem('cookie-consent')
  if (consent === 'declined') {
    ;(window as any)[`ga-disable-${gtagId}`] = true
  }

  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', gtagId)
})

declare global {
  interface Window {
    dataLayer: any[]
  }
}
