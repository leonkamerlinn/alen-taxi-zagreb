<template>
  <section id="kontakt" class="relative py-24 bg-gradient-to-br from-taxi-yellow to-taxi-gold overflow-hidden">
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-10" aria-hidden="true">
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    </div>

    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-taxi-dark mb-6">
        Spremni za vožnju?
      </h2>
      <p class="text-taxi-dark/80 text-lg mb-10 max-w-2xl mx-auto">
        Pošaljite poruku na WhatsApp ili nas jednostavno nazovite —
        recite nam polazište i taxi kreće prema vama.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          :href="whatsappLink()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-3 bg-taxi-dark hover:bg-taxi-darker text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl"
        >
          <IconWhatsApp class="w-8 h-8" />
          Naručite taxi
        </a>

        <a
          :href="telHref"
          class="inline-flex items-center gap-3 border-2 border-taxi-dark text-taxi-dark px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 hover:bg-taxi-dark hover:text-white active:scale-95"
        >
          <IconPhone class="w-6 h-6" />
          {{ phoneDisplay }}
        </a>
      </div>

      <a
        :href="viberHref"
        class="inline-flex items-center gap-2 mt-8 text-taxi-dark/80 hover:text-taxi-dark font-semibold transition-colors py-2"
      >
        <IconViber class="w-5 h-5" />
        Imate Viber? Naručite putem Vibera
        <IconArrowRight class="w-4 h-4" />
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
const { telHref, phoneDisplay, whatsappLink, viberHref } = useContact()
</script>
