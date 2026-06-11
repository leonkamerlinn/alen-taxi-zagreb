<template>
  <a
    :href="whatsappLink()"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Naručite taxi putem WhatsAppa"
    class="fixed right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
    :class="bannerVisible ? 'bottom-40 sm:bottom-6' : 'bottom-6'"
  >
    <span class="whatsapp-pulse-ring absolute inset-0 rounded-full bg-[#25D366]" aria-hidden="true"></span>
    <span class="absolute inset-0 rounded-full bg-[#25D366]" aria-hidden="true"></span>
    <IconWhatsApp class="relative w-8 h-8 text-white" />
  </a>
</template>

<script setup lang="ts">
const { whatsappLink } = useContact()
const bannerVisible = useConsentBannerVisible()
</script>
