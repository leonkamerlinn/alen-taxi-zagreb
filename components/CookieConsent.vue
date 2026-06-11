<template>
  <Transition name="consent">
    <div
      v-if="visible"
      role="region"
      aria-label="Obavijest o kolačićima"
      class="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md z-[60] border-t sm:border border-taxi-light bg-taxi-gray sm:rounded-2xl sm:shadow-2xl px-4 py-4 sm:px-6 sm:py-5"
    >
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:items-start">
        <p class="text-sm text-gray-300">
          Koristimo kolačiće kako bismo poboljšali vaše iskustvo na stranici.
        </p>
        <div class="flex shrink-0 gap-3">
          <button
            class="rounded-full border border-taxi-light px-5 py-2.5 text-sm text-gray-300 transition duration-300 hover:border-taxi-yellow hover:text-white"
            @click="decline"
          >
            Odbij
          </button>
          <button
            class="rounded-full bg-taxi-yellow px-5 py-2.5 text-sm font-semibold text-taxi-dark transition duration-300 hover:bg-taxi-gold"
            @click="accept"
          >
            Prihvati
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const visible = useConsentBannerVisible()

onMounted(() => {
  const consent = localStorage.getItem('cookie-consent')
  if (!consent) {
    visible.value = true
  } else if (consent === 'declined') {
    disableGtag()
  }
})

function accept() {
  localStorage.setItem('cookie-consent', 'accepted')
  window.gtag?.('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  })
  visible.value = false
}

function decline() {
  localStorage.setItem('cookie-consent', 'declined')
  disableGtag()
  visible.value = false
}

function disableGtag() {
  ;(window as any)['ga-disable-AW-17804137574'] = true
}
</script>

<style scoped>
.consent-enter-active {
  transition: transform 0.4s ease-out, opacity 0.4s ease-out;
}
.consent-leave-active {
  transition: transform 0.3s ease-in, opacity 0.3s ease-in;
}
.consent-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.consent-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
