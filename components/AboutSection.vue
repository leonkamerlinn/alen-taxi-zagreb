<template>
  <section id="o-nama" class="relative py-24 bg-taxi-surface border-y border-taxi-light/40">
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-5" aria-hidden="true">
      <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23F7C600\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <!-- Narrative -->
        <div>
          <span class="inline-block text-sm text-taxi-yellow font-semibold tracking-wider uppercase mb-4">O nama</span>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Više od 10 godina<br class="hidden sm:block">
            vozimo <span class="gradient-text">Zagreb</span>
          </h2>
          <p class="text-gray-400 text-lg leading-relaxed mb-8">
            Dolazak na željenu destinaciju u Zagrebu nikad nije bio lakši i udobniji. Vozimo po cijelom
            gradu i okolici, a cijenu znate prije polaska — bez skrivenih troškova i neugodnih iznenađenja.
          </p>

          <ul class="space-y-4">
            <li v-for="point in points" :key="point" class="flex items-start gap-3">
              <span class="flex items-center justify-center w-6 h-6 mt-0.5 bg-taxi-yellow/10 rounded-full shrink-0" aria-hidden="true">
                <IconCheck class="w-4 h-4 text-taxi-yellow" />
              </span>
              <span class="text-gray-300">{{ point }}</span>
            </li>
          </ul>
        </div>

        <!-- Feature highlights -->
        <div class="space-y-10">
          <div class="scroll-animate flex gap-5">
            <div class="w-14 h-14 bg-taxi-yellow/10 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
              <IconShield class="w-7 h-7 text-taxi-yellow" />
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2">Sigurnost na prvom mjestu</h3>
              <p class="text-gray-400 leading-relaxed">
                Naša vozila su moderna, udobna i besprijekorno čista, a svaka vožnja
                vodi vas najsigurnijom i najbržom rutom do odredišta.
              </p>
            </div>
          </div>

          <div class="scroll-animate flex gap-5">
            <div class="w-14 h-14 bg-taxi-yellow/10 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
              <IconUser class="w-7 h-7 text-taxi-yellow" />
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2">Profesionalni vozači</h3>
              <p class="text-gray-400 leading-relaxed">
                Bez obzira na to trebate li prijevoz do doma, hotela ili sastanka, naši ljubazni
                vozači stoje vam na raspolaganju za ugodno putovanje — danju i noću.
              </p>
            </div>
          </div>

          <div class="scroll-animate flex gap-5">
            <div class="w-14 h-14 bg-taxi-yellow/10 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
              <IconLocation class="w-7 h-7 text-taxi-yellow" />
            </div>
            <div>
              <h3 class="text-xl font-bold mb-2">Poznajemo svaki kvart</h3>
              <p class="text-gray-400 leading-relaxed">
                Godine iskustva u zagrebačkom prometu znače da uvijek znamo najbolji put —
                i u špici i u kasnim noćnim satima.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const points = [
  'Cijena dogovorena prije polaska',
  'Moderna, udobna i čista vozila',
  'Vozimo po cijelom Zagrebu i okolici',
  'Dostupni 24 sata dnevno, svaki dan',
]
</script>
