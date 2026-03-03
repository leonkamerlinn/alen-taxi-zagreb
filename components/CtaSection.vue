<template>
  <section class="relative py-24 bg-gradient-to-br from-taxi-yellow to-taxi-gold overflow-hidden">
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-10">
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
        Kontaktirajte nas putem WhatsApp-a i naručite svoj taxi u samo nekoliko sekundi.
        Brzo, jednostavno i pouzdano!
      </p>

      <a
        href="https://wa.me/385957703853"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-3 bg-taxi-dark hover:bg-taxi-darker text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
      >
        <IconWhatsApp class="w-8 h-8" />
        Naruči Taxi Sada
      </a>
    </div>
  </section>
</template>
