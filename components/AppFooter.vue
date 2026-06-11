<template>
  <footer class="bg-taxi-darker pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Footer content -->
      <div class="grid md:grid-cols-3 gap-12 mb-12">
        <!-- Brand column -->
        <div>
          <a href="#hero" class="inline-flex items-center gap-3 mb-6" @click.prevent="scrollTo('#hero')">
            <div class="w-12 h-12 bg-taxi-yellow rounded-xl flex items-center justify-center">
              <IconTaxi class="w-7 h-7 text-taxi-dark" />
            </div>
            <span class="text-xl font-bold"><span class="text-taxi-yellow">Taxi</span> Zagreb</span>
          </a>
          <p class="text-gray-400 mb-6">
            Lokalni taxi u Zagrebu — brz dolazak, profesionalni vozači i cijena koju znate prije polaska.
          </p>

          <!-- Social links -->
          <div class="flex gap-4">
            <a
              :href="whatsappLink()"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Naručite taxi putem WhatsAppa"
              class="w-11 h-11 bg-[#25D366] rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-300"
            >
              <IconWhatsApp class="w-5 h-5 text-white" />
            </a>
            <a
              :href="viberHref"
              aria-label="Naručite taxi putem Vibera"
              class="w-11 h-11 bg-[#7360F2] rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-300"
            >
              <IconViber class="w-5 h-5 text-white" />
            </a>
          </div>
        </div>

        <!-- Quick links -->
        <div>
          <h3 class="text-lg font-bold mb-6">Brze poveznice</h3>
          <ul class="space-y-2">
            <li>
              <a href="#hero" class="inline-block py-1 text-gray-400 hover:text-taxi-yellow transition-colors" @click.prevent="scrollTo('#hero')">Početna</a>
            </li>
            <li>
              <a href="#usluge" class="inline-block py-1 text-gray-400 hover:text-taxi-yellow transition-colors" @click.prevent="scrollTo('#usluge')">Usluge</a>
            </li>
            <li>
              <a href="#o-nama" class="inline-block py-1 text-gray-400 hover:text-taxi-yellow transition-colors" @click.prevent="scrollTo('#o-nama')">O nama</a>
            </li>
            <li>
              <a href="#pitanja" class="inline-block py-1 text-gray-400 hover:text-taxi-yellow transition-colors" @click.prevent="scrollTo('#pitanja')">Česta pitanja</a>
            </li>
            <li>
              <a :href="whatsappLink()" target="_blank" rel="noopener noreferrer" class="inline-block py-1 text-gray-400 hover:text-taxi-yellow transition-colors">Naručite taxi</a>
            </li>
          </ul>
        </div>

        <!-- Contact info -->
        <div>
          <h3 class="text-lg font-bold mb-6">Kontakt</h3>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <IconLocation class="w-5 h-5 text-taxi-yellow mt-0.5" aria-hidden="true" />
              <span class="text-gray-400">Zagreb, Hrvatska</span>
            </li>
            <li class="flex items-start gap-3">
              <IconPhone class="w-5 h-5 text-taxi-yellow mt-0.5" aria-hidden="true" />
              <a :href="telHref" class="text-gray-400 hover:text-taxi-yellow transition-colors">{{ phoneDisplay }}</a>
            </li>
            <li class="flex items-start gap-3">
              <IconWhatsApp class="w-5 h-5 text-taxi-yellow mt-0.5" aria-hidden="true" />
              <a :href="whatsappLink()" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-taxi-yellow transition-colors">WhatsApp</a>
            </li>
            <li class="flex items-start gap-3">
              <IconCheck class="w-5 h-5 text-taxi-yellow mt-0.5" aria-hidden="true" />
              <span class="text-gray-400">Radno vrijeme: 0–24, svaki dan</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer bottom -->
      <div class="border-t border-taxi-light pt-8">
        <p class="text-center text-gray-400 text-sm">
          &copy; {{ new Date().getFullYear() }} Taxi Zagreb. Sva prava pridržana.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { scrollTo } = useSmoothScroll()
const { telHref, phoneDisplay, whatsappLink, viberHref } = useContact()
</script>
