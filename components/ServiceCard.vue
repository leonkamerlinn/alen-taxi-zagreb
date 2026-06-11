<template>
  <div class="service-card scroll-animate group flex flex-col h-full bg-taxi-gray/50 border border-taxi-light rounded-3xl p-6 hover:border-taxi-yellow/50">
    <div class="w-14 h-14 bg-taxi-yellow/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-taxi-yellow/20 transition-colors duration-300" aria-hidden="true">
      <slot name="icon" />
    </div>

    <span class="text-xs text-taxi-yellow font-semibold tracking-wider uppercase">{{ number }}</span>
    <h3 class="text-xl font-bold mt-2 mb-4">{{ title }}</h3>
    <p class="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">{{ description }}</p>

    <a
      :href="whatsappLink(whatsappMessage)"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-auto flex w-full items-center justify-center gap-2 bg-taxi-yellow/10 hover:bg-taxi-yellow/20 text-taxi-yellow font-semibold text-sm px-4 py-3 rounded-xl transition-colors duration-300 active:scale-95"
    >
      <IconWhatsApp class="w-4 h-4" />
      Naručite taxi
      <IconArrowRight class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  number: string
  title: string
  description: string
  whatsappMessage: string
}>()

const { whatsappLink } = useContact()
</script>
