<template>
  <div class="min-h-screen bg-taxi-dark text-white flex items-center justify-center hero-pattern">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 -right-20 w-96 h-96 bg-taxi-yellow/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 -left-20 w-80 h-80 bg-taxi-yellow/5 rounded-full blur-3xl"></div>
    </div>

    <div class="relative text-center px-4 sm:px-6 max-w-2xl mx-auto">
      <!-- Error code -->
      <div class="relative mb-8">
        <span class="text-[10rem] sm:text-[14rem] font-bold leading-none gradient-text select-none">
          {{ error?.statusCode || 500 }}
        </span>
      </div>

      <!-- Error message -->
      <h1 class="text-2xl sm:text-3xl font-bold mb-4">
        <template v-if="error?.statusCode === 404">
          Stranica nije pronađena
        </template>
        <template v-else>
          Nešto je pošlo po krivu
        </template>
      </h1>

      <p class="text-gray-400 text-lg mb-10 max-w-md mx-auto">
        <template v-if="error?.statusCode === 404">
          Stranica koju tražite ne postoji ili je premještena.
        </template>
        <template v-else>
          Došlo je do greške na serveru. Pokušajte ponovo ili nas kontaktirajte.
        </template>
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          @click="handleError"
          class="group flex items-center justify-center gap-3 bg-taxi-yellow hover:bg-taxi-gold text-taxi-dark px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-taxi-yellow/25"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
          </svg>
          Natrag na početnu
        </button>

        <a
          href="tel:+385957703853"
          class="flex items-center justify-center gap-3 border-2 border-taxi-light hover:border-taxi-yellow text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-taxi-yellow/10"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          +385 95 770 3853
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })
</script>

<style scoped>
.gradient-text {
  background: linear-gradient(135deg, #F7C600 0%, #D4A900 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-pattern {
  background-image:
    radial-gradient(circle at 20% 50%, rgba(247, 198, 0, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(247, 198, 0, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 40% 80%, rgba(247, 198, 0, 0.05) 0%, transparent 40%);
}
</style>
