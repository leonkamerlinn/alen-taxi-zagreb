<template>
  <nav
    aria-label="Glavna navigacija"
    class="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
    :class="{ 'bg-taxi-darker/95 backdrop-blur-lg shadow-lg': isScrolled || isMobileMenuOpen }"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Logo -->
        <a href="#hero" class="flex items-center gap-3 group" @click.prevent="scrollTo('#hero')">
          <div class="w-12 h-12 bg-taxi-yellow rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
            <IconTaxi class="w-7 h-7 text-taxi-dark" />
          </div>
          <span class="text-xl font-bold"><span class="text-taxi-yellow">Taxi</span> Zagreb</span>
        </a>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <a href="#usluge" class="nav-link text-gray-300 hover:text-white transition-colors" @click.prevent="scrollTo('#usluge')">Usluge</a>
          <a href="#o-nama" class="nav-link text-gray-300 hover:text-white transition-colors" @click.prevent="scrollTo('#o-nama')">O nama</a>
          <a href="#pitanja" class="nav-link text-gray-300 hover:text-white transition-colors" @click.prevent="scrollTo('#pitanja')">Česta pitanja</a>
          <a href="#kontakt" class="nav-link text-gray-300 hover:text-white transition-colors" @click.prevent="scrollTo('#kontakt')">Kontakt</a>

          <a
            :href="whatsappLink()"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 bg-taxi-yellow hover:bg-taxi-gold text-taxi-dark px-5 py-2.5 rounded-full font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <IconWhatsApp class="w-5 h-5" />
            <span>Naručite taxi</span>
          </a>
        </div>

        <!-- Mobile: tap-to-call + menu button -->
        <div class="flex items-center gap-3 md:hidden">
          <a
            :href="telHref"
            aria-label="Nazovite taxi"
            class="flex items-center justify-center w-11 h-11 bg-taxi-yellow rounded-full text-taxi-dark active:scale-95 transition-transform duration-300"
          >
            <IconPhone class="w-5 h-5" />
          </a>
          <button
            class="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-taxi-gray transition-colors"
            :aria-expanded="isMobileMenuOpen"
            aria-controls="mobile-menu"
            :aria-label="isMobileMenuOpen ? 'Zatvori izbornik' : 'Otvori izbornik'"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path v-if="isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-show="isMobileMenuOpen" id="mobile-menu" class="md:hidden bg-taxi-darker/95 backdrop-blur-lg border-t border-taxi-gray">
        <div class="px-4 py-6 space-y-2">
          <a href="#usluge" class="block text-gray-300 hover:text-white py-3 transition-colors" @click.prevent="mobileNav('#usluge')">Usluge</a>
          <a href="#o-nama" class="block text-gray-300 hover:text-white py-3 transition-colors" @click.prevent="mobileNav('#o-nama')">O nama</a>
          <a href="#pitanja" class="block text-gray-300 hover:text-white py-3 transition-colors" @click.prevent="mobileNav('#pitanja')">Česta pitanja</a>
          <a href="#kontakt" class="block text-gray-300 hover:text-white py-3 transition-colors" @click.prevent="mobileNav('#kontakt')">Kontakt</a>
          <a :href="telHref" class="flex items-center gap-3 text-gray-300 hover:text-white py-3 transition-colors">
            <IconPhone class="w-5 h-5 text-taxi-yellow" />
            {{ phoneDisplay }}
          </a>
          <a
            :href="whatsappLink()"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 bg-taxi-yellow text-taxi-dark px-5 py-3 rounded-full font-semibold mt-4 active:scale-95 transition-transform duration-300"
          >
            <IconWhatsApp class="w-5 h-5" />
            <span>Naručite taxi</span>
          </a>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
const { isScrolled } = useNavbarScroll()
const { scrollTo } = useSmoothScroll()
const { telHref, phoneDisplay, whatsappLink } = useContact()
const isMobileMenuOpen = ref(false)

function mobileNav(hash: string) {
  isMobileMenuOpen.value = false
  scrollTo(hash)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') isMobileMenuOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
