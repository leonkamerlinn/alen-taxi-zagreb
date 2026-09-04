<template>
  <div class="min-h-screen flex items-center justify-center bg-taxi-dark px-4">
    <form
      class="w-full max-w-sm bg-taxi-gray border border-taxi-light rounded-3xl p-8 shadow-2xl"
      @submit.prevent="submit"
    >
      <div class="mb-6">
        <span class="text-xs font-semibold uppercase tracking-wider text-taxi-yellow">Taxi Zagreb</span>
        <h1 class="mt-2 text-2xl font-bold text-white">Admin prijava</h1>
        <p class="mt-1 text-sm text-gray-400">Pristup nadzornoj ploči prometa.</p>
      </div>

      <label class="mb-2 block text-xs text-gray-400" for="password">Lozinka</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="mb-4 w-full rounded-xl border border-taxi-light bg-taxi-dark px-4 py-3 text-white outline-none transition focus:border-taxi-yellow"
      />

      <p v-if="error" class="mb-4 text-sm text-red-400">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-taxi-yellow px-4 py-3 font-semibold text-taxi-dark transition hover:bg-taxi-gold active:scale-[0.99] disabled:opacity-60"
      >
        {{ loading ? 'Prijava…' : 'Prijavi se' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Admin — prijava' })

const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    await navigateTo('/dashboard')
  } catch {
    error.value = 'Neispravna lozinka.'
  } finally {
    loading.value = false
  }
}
</script>
