<template>
  <section id="usluge" class="relative py-24 bg-taxi-dark">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center mb-16">
        <span class="inline-block text-taxi-yellow font-semibold tracking-wider uppercase mb-4">Naše usluge</span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Odaberi <span class="gradient-text">uslugu</span>
        </h2>
        <p class="text-gray-400 max-w-2xl mx-auto text-lg">
          Nudimo širok spektar taxi usluga prilagođenih vašim potrebama. Od zračne luke do noćnog prijevoza - tu smo za vas.
        </p>
      </div>

      <!-- Services grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    title: 'Taxi do aerodroma Zagreb',
    description: 'Kašnjenje na let nije opcija kada koristite našu uslugu taxi prijevoza do aerodroma Zagreb. Dočekat ćemo vas na vrijeme i osigurati siguran dolazak.',
    whatsappMessage: 'Pozdrav, trebam taxi do aerodroma Zagreb',
    icon: resolveComponent('IconPlane'),
  },
  {
    number: 'Usluga 02',
    title: 'Gradski prijevoz taxi Zagreb',
    description: 'Gradski prijevoz taxi Zagreb je najpouzdanija opcija za brzu i sigurnu vožnju po Zagrebu. Naši iskusni vozači su tu za vas.',
    whatsappMessage: 'Pozdrav, trebam gradski taxi prijevoz',
    icon: resolveComponent('IconBuilding'),
  },
  {
    number: 'Usluga 03',
    title: 'Poslovni prijevoz taxi Zagreb',
    description: 'Ako dolazite u posjetu ili imate sastanke u Zagrebu, tu smo da vam osiguramo siguran i udoban prijevoz dok se posvećujete poslovnim obavezama.',
    whatsappMessage: 'Pozdrav, trebam poslovni taxi prijevoz',
    icon: resolveComponent('IconBriefcase'),
  },
  {
    number: 'Usluga 04',
    title: 'Noćni prijevoz taxi Zagreb',
    description: 'Idealno rješenje za sve koji trebaju siguran prijevoz u kasnim satima. Kada se vraćate s noćnog izlaska, tu smo za vas.',
    whatsappMessage: 'Pozdrav, trebam noćni taxi prijevoz',
    icon: resolveComponent('IconMoon'),
  },
]
</script>
