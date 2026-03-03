<template>
  <div class="bg-taxi-dark text-white overflow-x-hidden font-outfit">
    <AppNavbar />
    <HeroSection />
    <AboutSection />
    <ServicesSection />
    <CtaSection />
    <AppFooter />
    <WhatsAppFloat />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Taxi Zagreb - Brzi i pouzdani prijevoz',
  description: 'Taxi Zagreb - Vaša sigurna i pouzdana vožnja u Zagrebu. Brzi prijevoz do aerodroma, gradski i poslovni prijevoz.',
})

useScrollAnimation()
</script>
