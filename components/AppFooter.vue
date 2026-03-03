<template>
  <footer id="kontakt" class="bg-taxi-darker pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Footer content -->
      <div class="grid md:grid-cols-3 gap-12 mb-12">
        <!-- Brand column -->
        <div>
          <a href="#" class="flex items-center gap-3 mb-6" @click.prevent="scrollTo('#hero')">
            <div class="w-12 h-12 bg-taxi-yellow rounded-xl flex items-center justify-center">
              <IconTaxi class="w-7 h-7 text-taxi-dark" />
            </div>
            <span class="text-xl font-bold"><span class="text-taxi-yellow">Taxi</span> Zagreb</span>
          </a>
          <p class="text-gray-400 mb-6">
            Vaša sigurna i pouzdana vožnja u Zagrebu. Brz prijevoz, profesionalni vozači, transparentne cijene.
          </p>

          <!-- Social links -->
          <div class="flex gap-4">
            <a
              href="https://wa.me/385957703853"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <IconWhatsApp class="w-5 h-5 text-white" />
            </a>
            <a
              href="viber://chat?number=385957703853"
              class="w-10 h-10 bg-[#7360F2] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <IconViber class="w-5 h-5 text-white" />
            </a>
          </div>
        </div>

        <!-- Quick links -->
        <div>
          <h3 class="text-lg font-bold mb-6">Brze poveznice</h3>
          <ul class="space-y-3">
            <li>
              <a href="#hero" class="text-gray-400 hover:text-taxi-yellow transition-colors" @click.prevent="scrollTo('#hero')">Početna</a>
            </li>
            <li>
              <a href="#o-nama" class="text-gray-400 hover:text-taxi-yellow transition-colors" @click.prevent="scrollTo('#o-nama')">O nama</a>
            </li>
            <li>
              <a href="#usluge" class="text-gray-400 hover:text-taxi-yellow transition-colors" @click.prevent="scrollTo('#usluge')">Usluge</a>
            </li>
            <li>
              <a href="https://wa.me/385957703853" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-taxi-yellow transition-colors">Naruči Taxi</a>
            </li>
          </ul>
        </div>

        <!-- Contact info -->
        <div>
          <h3 class="text-lg font-bold mb-6">Kontakt</h3>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <IconLocation class="w-5 h-5 text-taxi-yellow mt-0.5" />
              <span class="text-gray-400">Zagreb, Hrvatska</span>
            </li>
            <li class="flex items-start gap-3">
              <IconPhone class="w-5 h-5 text-taxi-yellow mt-0.5" />
              <a href="tel:+385957703853" class="text-gray-400 hover:text-taxi-yellow transition-colors">+385 95 770 3853</a>
            </li>
            <li class="flex items-start gap-3">
              <IconWhatsApp class="w-5 h-5 text-taxi-yellow mt-0.5" />
              <a href="https://wa.me/385957703853" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-taxi-yellow transition-colors">WhatsApp</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer bottom -->
      <div class="border-t border-taxi-light pt-8">
        <p class="text-center text-gray-500 text-sm">
          &copy; 2024 Taxi Zagreb. Sva prava pridržana.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { scrollTo } = useSmoothScroll()
</script>
