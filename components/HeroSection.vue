<template>
  <section id="hero" class="relative min-h-screen flex items-center hero-pattern">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute top-1/4 -right-20 w-96 h-96 bg-taxi-yellow/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 -left-20 w-80 h-80 bg-taxi-yellow/5 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 sm:py-32">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Hero Content -->
        <div class="space-y-6 sm:space-y-8">
          <div class="inline-flex items-center gap-2 bg-taxi-gray/50 border border-taxi-light px-4 py-2 rounded-full animate-fade-in-up">
            <span class="w-2 h-2 bg-taxi-yellow rounded-full animate-pulse" aria-hidden="true"></span>
            <span class="text-sm text-gray-400">Dostupni 24/7</span>
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight animate-fade-in-up animation-delay-200">
            Brzi i pouzdani<br class="hidden sm:block">
            prijevoz u <span class="gradient-text">Zagrebu!</span>
          </h1>

          <p class="text-lg text-gray-400 max-w-xl animate-fade-in-up animation-delay-400">
            Bez obzira na to putujete li do zračne luke, željezničkog kolodvora ili bilo koje druge lokacije u Zagrebu,
            stižete uvijek na vrijeme. Pošaljite poruku ili nazovite — krećemo odmah.
          </p>

          <div class="space-y-3 animate-fade-in-up animation-delay-600">
            <div class="flex flex-col sm:flex-row gap-4">
              <a
                :href="whatsappLink()"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex items-center justify-center gap-3 bg-taxi-yellow hover:bg-taxi-gold text-taxi-dark px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-taxi-yellow/25"
              >
                <IconWhatsApp class="w-6 h-6" />
                Naručite taxi
                <IconArrowRight class="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </a>

              <a
                :href="telHref"
                class="flex items-center justify-center gap-3 border-2 border-taxi-light hover:border-taxi-yellow text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 active:scale-95 hover:bg-taxi-yellow/10"
              >
                <IconPhone class="w-6 h-6" />
                {{ phoneDisplay }}
              </a>
            </div>
            <p class="text-sm text-gray-400">We speak English — book your Zagreb airport transfer via WhatsApp.</p>
          </div>

          <!-- Trust badges -->
          <div class="flex items-center justify-between gap-4 sm:justify-start sm:gap-8 pt-8 border-t border-taxi-light/50">
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-taxi-yellow">10+</div>
              <div class="text-sm text-gray-400">Godina iskustva</div>
            </div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-taxi-yellow">24/7</div>
              <div class="text-sm text-gray-400">Dostupnost</div>
            </div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-taxi-yellow">Fiksna</div>
              <div class="text-sm text-gray-400">Cijena unaprijed</div>
            </div>
          </div>
        </div>

        <!-- Booking chat preview -->
        <div class="relative hidden lg:block" aria-hidden="true">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-br from-taxi-yellow/20 to-transparent rounded-full blur-3xl"></div>

            <div class="relative bg-gradient-to-br from-taxi-gray to-taxi-darker p-8 rounded-3xl border border-taxi-light max-w-md mx-auto">
              <!-- Chat header -->
              <div class="flex items-center gap-3 pb-5 border-b border-taxi-light/50">
                <div class="w-11 h-11 bg-taxi-yellow rounded-full flex items-center justify-center">
                  <IconTaxi class="w-6 h-6 text-taxi-dark" />
                </div>
                <div>
                  <div class="font-semibold">Taxi Zagreb</div>
                  <div class="text-xs text-gray-400 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 bg-[#25D366] rounded-full"></span>
                    online
                  </div>
                </div>
              </div>

              <!-- Messages -->
              <div class="space-y-3 pt-6">
                <div class="max-w-[85%] bg-taxi-light/60 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-200">
                  Pozdrav! Trebam taxi do Zračne luke Zagreb. ✈️
                </div>
                <div class="ml-auto w-fit max-w-[85%] bg-taxi-yellow text-taxi-dark rounded-2xl rounded-br-md px-4 py-3 text-sm font-medium">
                  Naravno! Recite nam adresu i krećemo odmah. 🚕
                </div>
                <div class="max-w-[85%] bg-taxi-light/60 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-200">
                  Odlično — vidimo se za par minuta!
                </div>
              </div>

              <!-- Floating elements -->
              <div class="absolute -top-4 -right-4 bg-taxi-yellow text-taxi-dark p-4 rounded-2xl shadow-lg">
                <IconCheck class="w-8 h-8" />
              </div>

              <div class="absolute -bottom-4 -left-4 bg-[#25D366] text-white p-4 rounded-2xl shadow-lg">
                <IconWhatsApp class="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <button
      class="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 p-2 motion-safe:animate-bounce"
      aria-label="Pomaknite se na usluge"
      @click="scrollTo('#usluge')"
    >
      <svg class="w-6 h-6 text-taxi-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
    </button>
  </section>
</template>

<script setup lang="ts">
const { telHref, phoneDisplay, whatsappLink } = useContact()
const { scrollTo } = useSmoothScroll()
</script>
