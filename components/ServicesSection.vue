<template>
  <section id="usluge" class="relative py-24 bg-taxi-dark">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center mb-16">
        <span class="inline-block text-sm text-taxi-yellow font-semibold tracking-wider uppercase mb-4">Naše usluge</span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Odaberite <span class="gradient-text">uslugu</span>
        </h2>
        <p class="text-gray-400 max-w-2xl mx-auto text-lg">
          Od Zračne luke Zagreb do noćnih vožnji — odaberite uslugu i naručite taxi jednom porukom.
        </p>
      </div>

      <!-- Services grid -->
      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <ServiceCard
          v-for="service in services"
          :key="service.number"
          :number="service.number"
          :title="service.title"
          :description="service.description"
          :whatsapp-message="service.whatsappMessage"
        >
          <template #icon>
            <component :is="service.icon" class="w-7 h-7 text-taxi-yellow" />
          </template>
        </ServiceCard>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const services = [
  {
    number: 'Usluga 01',
    title: 'Taxi do Zračne luke Zagreb',
    description: 'Kašnjenje na let nije opcija. Javite nam termin i polazište — dolazimo na vrijeme i vozimo vas izravno do terminala, bez stresa.',
    whatsappMessage: 'Pozdrav, trebam taxi do Zračne luke Zagreb. Polazna adresa: ',
    icon: resolveComponent('IconPlane'),
  },
  {
    number: 'Usluga 02',
    title: 'Gradski prijevoz',
    description: 'Brza vožnja od vrata do vrata, bilo gdje u Zagrebu. Poznajemo svaki kvart i uvijek biramo najbolju rutu za vas.',
    whatsappMessage: 'Pozdrav, trebam gradski taxi prijevoz. Polazna adresa: ',
    icon: resolveComponent('IconBuilding'),
  },
  {
    number: 'Usluga 03',
    title: 'Poslovni prijevoz',
    description: 'Uredna vozila i diskretni vozači za sastanke, evente i poslovne goste. Posvetite se poslu — o prijevozu brinemo mi.',
    whatsappMessage: 'Pozdrav, trebam poslovni taxi prijevoz. Polazna adresa: ',
    icon: resolveComponent('IconBriefcase'),
  },
  {
    number: 'Usluga 04',
    title: 'Noćni prijevoz',
    description: 'Vraćate se s izlaska ili kasnog leta? Dostupni smo cijelu noć — javite se i čekamo vas na dogovorenom mjestu.',
    whatsappMessage: 'Pozdrav, trebam noćni taxi prijevoz. Polazna adresa: ',
    icon: resolveComponent('IconMoon'),
  },
]
</script>
