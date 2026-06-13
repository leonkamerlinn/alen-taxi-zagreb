export default defineNuxtConfig({
  ssr: true,

  modules: ['@nuxtjs/tailwindcss'],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'hr' },
      bodyAttrs: { class: 'bg-taxi-dark text-white overflow-x-hidden' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Taxi Zagreb — Prijevoz 24/7 | Zračna luka, gradske i noćne vožnje',
      meta: [
        { name: 'google-site-verification', content: 'vkei09H2wMFcaCXdJEM7Ezgk6ihlaKCtJttnJIUFYpw' },
        { name: 'theme-color', content: '#0D0D0D' },
        { name: 'color-scheme', content: 'dark' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap', rel: 'stylesheet' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      script: [
        { src: 'https://www.googletagmanager.com/gtag/js?id=AW-17804137574', async: true },
      ],
    },
  },

  runtimeConfig: {
    // Server-only secrets (set via env / Secret Manager; never exposed to the browser)
    fingerprintSecretApiKey: '', // NUXT_FINGERPRINT_SECRET_API_KEY
    adminPassword: '', // NUXT_ADMIN_PASSWORD
    sessionSecret: '', // NUXT_SESSION_SECRET (random 32+ bytes)
    public: {
      gtagId: 'AW-17804137574',
      fingerprintPublicApiKey: '', // NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY
      fingerprintRegion: 'eu', // NUXT_PUBLIC_FINGERPRINT_REGION (eu | us | ap)
      fingerprintEndpoint: '', // NUXT_PUBLIC_FINGERPRINT_ENDPOINT (custom subdomain, optional)
      fingerprintScriptUrlPattern: '', // NUXT_PUBLIC_FINGERPRINT_SCRIPT_URL_PATTERN (optional)
    },
  },

  nitro: {
    preset: 'node-server',
  },

  compatibilityDate: '2025-03-03',
})
