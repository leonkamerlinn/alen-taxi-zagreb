export default defineNuxtConfig({
  ssr: true,

  modules: ['@nuxtjs/tailwindcss'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'hr' },
      bodyAttrs: { class: 'bg-taxi-dark text-white overflow-x-hidden' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Taxi Zagreb - Brzi i pouzdani prijevoz',
      meta: [
        { name: 'description', content: 'Taxi Zagreb - Vaša sigurna i pouzdana vožnja u Zagrebu. Brzi prijevoz do aerodroma, gradski i poslovni prijevoz.' },
        { name: 'google-site-verification', content: 'vkei09H2wMFcaCXdJEM7Ezgk6ihlaKCtJttnJIUFYpw' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap', rel: 'stylesheet' },
      ],
      script: [
        { src: 'https://www.googletagmanager.com/gtag/js?id=AW-17804137574', async: true },
      ],
    },
  },

  runtimeConfig: {
    public: {
      gtagId: 'AW-17804137574',
    },
  },

  nitro: {
    preset: 'node-server',
  },

  compatibilityDate: '2025-03-03',
})
