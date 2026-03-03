<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="{ 'bg-taxi-darker/95 backdrop-blur-lg shadow-lg': isScrolled }"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Logo -->
        <a href="#" class="flex items-center gap-3 group" @click.prevent="scrollTo('#hero')">
          <div class="w-12 h-12 bg-taxi-yellow rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
            <IconTaxi class="w-7 h-7 text-taxi-dark" />
          </div>
          <span class="text-xl font-bold"><span class="text-taxi-yellow">Taxi</span> Zagreb</span>
        </a>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <a href="#o-nama" class="nav-link text-gray-300 hover:text-white transition-colors" @click.prevent="scrollTo('#o-nama')">O nama</a>
          <a href="#usluge" class="nav-link text-gray-300 hover:text-white transition-colors" @click.prevent="scrollTo('#usluge')">Usluge</a>
          <a href="#kontakt" class="nav-link text-gray-300 hover:text-white transition-colors" @click.prevent="scrollTo('#kontakt')">Kontakt</a>

          <a
            href="https://wa.me/385957703853"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 hover:scale-105"
          >
            <IconWhatsApp class="w-5 h-5" />
            <span>WhatsApp</span>
          </a>
        </div>

        <!-- Mobile Menu Button -->
        <button class="md:hidden p-2 rounded-lg hover:bg-taxi-gray transition-colors" @click="isMobileMenuOpen = !isMobileMenuOpen">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-show="isMobileMenuOpen" class="md:hidden bg-taxi-darker/95 backdrop-blur-lg border-t border-taxi-gray">
      <div class="px-4 py-6 space-y-4">
        <a href="#o-nama" class="block text-gray-300 hover:text-white py-2 transition-colors" @click.prevent="mobileNav('#o-nama')">O nama</a>
        <a href="#usluge" class="block text-gray-300 hover:text-white py-2 transition-colors" @click.prevent="mobileNav('#usluge')">Usluge</a>
        <a href="#kontakt" class="block text-gray-300 hover:text-white py-2 transition-colors" @click.prevent="mobileNav('#kontakt')">Kontakt</a>
        <a
          href="https://wa.me/385957703853"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-full font-medium mt-4"
        >
          <IconWhatsApp class="w-5 h-5" />
          <span>Kontaktirajte nas</span>
        </a>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { isScrolled } = useNavbarScroll()
const { scrollTo } = useSmoothScroll()
const isMobileMenuOpen = ref(false)

function mobileNav(hash: string) {
  isMobileMenuOpen.value = false
  scrollTo(hash)
}
</script>
