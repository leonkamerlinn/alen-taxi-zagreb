<template>
  <div class="bg-taxi-dark text-white overflow-x-hidden font-outfit">
    <a
      href="#usluge"
      class="sr-only focus:not-sr-only focus:fixed focus:z-[70] focus:top-2 focus:left-2 focus:bg-taxi-yellow focus:text-taxi-dark focus:px-4 focus:py-2 focus:rounded-full focus:font-semibold"
    >
      Preskoči na sadržaj
    </a>
    <AppNavbar />
    <main>
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <FaqSection />
      <CtaSection />
    </main>
    <AppFooter />
    <WhatsAppFloat />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Taxi Zagreb — Prijevoz 24/7 | Zračna luka, gradske i noćne vožnje',
  description: 'Taxi Zagreb dostupan 24/7. Prijevoz do Zračne luke Zagreb, gradski, poslovni i noćni prijevoz. Naručite na WhatsApp ili nazovite +385 95 770 3853.',
  ogTitle: 'Taxi Zagreb — Brzi i pouzdani prijevoz 24/7',
  ogDescription: 'Prijevoz do Zračne luke Zagreb, gradske, poslovne i noćne vožnje. Naručite taxi jednom porukom na WhatsApp.',
  ogImage: '/og-image.png',
  ogType: 'website',
  ogLocale: 'hr_HR',
  twitterCard: 'summary_large_image',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'TaxiService'],
        name: 'Taxi Zagreb',
        telephone: '+385957703853',
        areaServed: { '@type': 'City', name: 'Zagreb' },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Zagreb',
          addressCountry: 'HR',
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
        priceRange: '€€',
      }),
    },
  ],
})

useScrollAnimation()
</script>
