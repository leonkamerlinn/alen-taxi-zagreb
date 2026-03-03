<template>
  <section id="hero" class="relative min-h-screen flex items-center hero-pattern">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 -right-20 w-96 h-96 bg-taxi-yellow/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 -left-20 w-80 h-80 bg-taxi-yellow/5 rounded-full blur-3xl"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Hero Content -->
        <div class="space-y-8">
          <div class="inline-flex items-center gap-2 bg-taxi-gray/50 border border-taxi-light px-4 py-2 rounded-full animate-fade-in-up opacity-0">
            <span class="w-2 h-2 bg-taxi-yellow rounded-full animate-pulse"></span>
            <span class="text-sm text-gray-400">Dostupni 24/7</span>
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in-up opacity-0 animation-delay-200">
            Brzi i pouzdani<br>
            prijevoz u <span class="gradient-text">Zagrebu!</span>
          </h1>

          <p class="text-lg text-gray-400 max-w-xl animate-fade-in-up opacity-0 animation-delay-400">
            Bez obzira na to putujete li do aerodroma, željezničkog kolodvora ili bilo koje druge lokacije u Zagrebu,
            naša taxi usluga vam osigurava brz i pouzdan prijevoz. Uz nas, stižete uvijek na vrijeme!
          </p>

          <div class="flex flex-col sm:flex-row gap-4 animate-fade-in-up opacity-0 animation-delay-600">
            <a
              href="https://wa.me/385957703853"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-center gap-3 bg-taxi-yellow hover:bg-taxi-gold text-taxi-dark px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-taxi-yellow/25"
            >
              <IconWhatsApp class="w-6 h-6" />
              Naruči Taxi
              <IconArrowRight class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="tel:+385957703853"
              class="flex items-center justify-center gap-3 border-2 border-taxi-light hover:border-taxi-yellow text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-taxi-yellow/10"
            >
              <IconPhone class="w-6 h-6" />
              +385 95 770 3853
            </a>
          </div>

          <!-- Trust badges -->
          <div class="flex items-center gap-8 pt-8 border-t border-taxi-light/50">
            <div class="text-center">
              <div class="text-3xl font-bold text-taxi-yellow">10+</div>
              <div class="text-sm text-gray-500">Godina iskustva</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-taxi-yellow">24/7</div>
              <div class="text-sm text-gray-500">Dostupnost</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-taxi-yellow">100%</div>
              <div class="text-sm text-gray-500">Pouzdanost</div>
            </div>
          </div>
        </div>

        <!-- Hero Image/Illustration -->
        <div class="relative hidden lg:block">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-br from-taxi-yellow/20 to-transparent rounded-full blur-3xl"></div>

            <div class="relative bg-gradient-to-br from-taxi-gray to-taxi-darker p-12 rounded-3xl border border-taxi-light">
              <IconTaxiLarge class="w-full h-auto text-taxi-yellow" />

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
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <svg class="w-6 h-6 text-taxi-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
    </div>
  </section>
</template>
