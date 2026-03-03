<template>
  <div class="service-card scroll-animate group bg-taxi-gray/50 border border-taxi-light rounded-3xl p-6 hover:border-taxi-yellow/50">
    <div class="w-14 h-14 bg-taxi-yellow/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-taxi-yellow/20 transition-colors duration-300">
      <slot name="icon" />
    </div>

    <span class="text-xs text-taxi-yellow font-semibold tracking-wider uppercase">{{ number }}</span>
    <h3 class="text-xl font-bold mt-2 mb-4">{{ title }}</h3>
    <p class="text-gray-400 text-sm leading-relaxed mb-6">{{ description }}</p>

    <a
      :href="`https://wa.me/385957703853?text=${encodeURIComponent(whatsappMessage)}`"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 text-taxi-yellow hover:text-taxi-gold font-semibold text-sm transition-colors"
    >
      <IconWhatsApp class="w-4 h-4" />
      Naruči taxi
      <IconArrowRight class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
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
</script>
