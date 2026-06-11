<template>
  <section id="pitanja" class="relative py-24 bg-taxi-dark">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center mb-16">
        <span class="inline-block text-sm text-taxi-yellow font-semibold tracking-wider uppercase mb-4">Česta pitanja</span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Sve što vas <span class="gradient-text">zanima</span>
        </h2>
        <p class="text-gray-400 max-w-2xl mx-auto text-lg">
          Imate dodatno pitanje? Pošaljite nam poruku — odgovaramo u nekoliko minuta.
        </p>
      </div>

      <!-- FAQ list -->
      <div class="space-y-4">
        <div
          v-for="(item, index) in faqs"
          :key="index"
          class="bg-taxi-gray/50 border border-taxi-light rounded-2xl overflow-hidden transition-colors duration-300"
          :class="{ 'border-taxi-yellow/50': openIndex === index }"
        >
          <h3>
            <button
              class="flex w-full items-center justify-between gap-4 text-left px-6 py-5 font-semibold text-base sm:text-lg"
              :aria-expanded="openIndex === index"
              :aria-controls="`faq-panel-${index}`"
              @click="toggle(index)"
            >
              {{ item.question }}
              <svg
                class="w-5 h-5 text-taxi-yellow shrink-0 transition-transform duration-300"
                :class="{ 'rotate-180': openIndex === index }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </h3>
          <div v-show="openIndex === index" :id="`faq-panel-${index}`" class="px-6 pb-5">
            <p class="text-gray-400 leading-relaxed">{{ item.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const faqs = [
  {
    question: 'Koliko košta vožnja do Zračne luke Zagreb?',
    answer: 'Cijenu znate prije polaska — pošaljite nam polazište putem WhatsAppa ili Vibera i odmah dobivate fiksnu ponudu, bez skrivenih troškova.',
  },
  {
    question: 'Koliko brzo stižete?',
    answer: 'Ovisno o vašoj lokaciji i prometu, u pravilu smo kod vas za nekoliko minuta. Dostupni smo 24 sata dnevno, svaki dan u tjednu.',
  },
  {
    question: 'Mogu li rezervirati vožnju unaprijed?',
    answer: 'Naravno. Pošaljite nam datum, vrijeme i polaznu adresu, i vozilo će vas čekati točno kada vam treba — idealno za rane letove i važne sastanke.',
  },
  {
    question: 'Vozite li izvan Zagreba?',
    answer: 'Da — uz prethodni dogovor vozimo i okolicu Zagreba te međugradske relacije i transfere.',
  },
  {
    question: 'Do you speak English?',
    answer: 'Yes! Feel free to book your ride or Zagreb airport transfer in English — just send us a WhatsApp message and we will reply right away.',
  },
]

const openIndex = ref<number | null>(0)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }),
    },
  ],
})
</script>
