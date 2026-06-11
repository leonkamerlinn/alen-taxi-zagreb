<template>
  <div class="min-h-screen bg-taxi-dark text-white flex items-center justify-center hero-pattern font-outfit">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
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
          Došlo je do greške na serveru. Pokušajte ponovno ili nas kontaktirajte.
        </template>
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          @click="handleError"
          class="group flex items-center justify-center gap-3 bg-taxi-yellow hover:bg-taxi-gold text-taxi-dark px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-taxi-yellow/25"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
          </svg>
          Natrag na početnu
        </button>

        <a
          :href="whatsappLink()"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-3 border-2 border-taxi-light hover:border-taxi-yellow text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 active:scale-95 hover:bg-taxi-yellow/10"
        >
          <IconWhatsApp class="w-5 h-5" />
          Naručite taxi
        </a>

        <a
          :href="telHref"
          class="flex items-center justify-center gap-3 border-2 border-taxi-light hover:border-taxi-yellow text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 active:scale-95 hover:bg-taxi-yellow/10"
        >
          <IconPhone class="w-5 h-5" />
          {{ phoneDisplay }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const { telHref, phoneDisplay, whatsappLink } = useContact()

useHead({
  title: computed(() =>
    props.error?.statusCode === 404
      ? 'Stranica nije pronađena — Taxi Zagreb'
      : 'Greška — Taxi Zagreb'
  ),
})

const handleError = () => clearError({ redirect: '/' })
</script>
