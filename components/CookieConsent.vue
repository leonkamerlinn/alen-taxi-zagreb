<template>
  <Transition name="consent">
    <div
      v-if="visible"
      class="fixed bottom-0 left-0 right-0 z-50 border-t border-taxi-light bg-taxi-gray px-4 py-4 sm:px-6"
    >
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <p class="text-sm text-gray-300 sm:flex-1">
          Koristimo kolačiće kako bismo poboljšali vaše iskustvo na stranici.
        </p>
        <div class="flex shrink-0 gap-3">
          <button
            class="rounded-lg border border-gray-500 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-300 hover:text-white"
            @click="decline"
          >
            Odbij
          </button>
          <button
            class="rounded-lg bg-taxi-yellow px-4 py-2 text-sm font-semibold text-taxi-dark transition hover:bg-taxi-gold"
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
const visible = ref(false)

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
