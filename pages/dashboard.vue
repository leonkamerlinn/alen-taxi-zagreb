<template>
  <div class="min-h-screen bg-taxi-dark text-white">
    <!-- Header -->
    <header class="border-b border-taxi-light bg-taxi-darker/80 backdrop-blur sticky top-0 z-10">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-taxi-yellow">Taxi Zagreb</span>
          <h1 class="text-lg font-bold">Nadzorna ploča prometa</h1>
        </div>
        <div class="flex items-center gap-2">
          <div class="hidden gap-1 rounded-full border border-taxi-light p-1 sm:flex">
            <button
              v-for="d in [7, 14, 30]"
              :key="d"
              class="rounded-full px-3 py-1 text-sm transition"
              :class="days === d ? 'bg-taxi-yellow text-taxi-dark font-semibold' : 'text-gray-400 hover:text-white'"
              @click="days = d"
            >
              {{ d }}d
            </button>
          </div>
          <button
            class="rounded-full border border-taxi-light px-4 py-2 text-sm text-gray-300 transition hover:border-taxi-yellow hover:text-white"
            @click="logout"
          >
            Odjava
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <!-- Not configured notice -->
      <div
        v-if="stats && stats.configured === false"
        class="rounded-2xl border border-taxi-yellow/40 bg-taxi-yellow/5 p-6 text-sm text-gray-300"
      >
        <p class="font-semibold text-taxi-yellow">Fingerprint još nije konfiguriran.</p>
        <p class="mt-1">
          Postavite <code class="text-white">NUXT_FINGERPRINT_SECRET_API_KEY</code> i
          <code class="text-white">NUXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY</code>. Upute: <code class="text-white">docs/FINGERPRINT_SETUP.md</code>.
        </p>
      </div>

      <template v-else>
        <!-- Stat cards -->
        <section class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div class="rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
            <p class="text-xs uppercase tracking-wider text-gray-400">Posjeta</p>
            <p class="mt-2 text-3xl font-bold">{{ stats?.total ?? '—' }}</p>
            <p class="mt-1 text-xs text-gray-500">zadnjih {{ stats?.days ?? days }} dana</p>
          </div>
          <div class="rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
            <p class="text-xs uppercase tracking-wider text-gray-400">Jedinstveni posjetitelji</p>
            <p class="mt-2 text-3xl font-bold text-taxi-yellow">{{ stats?.uniqueVisitors ?? '—' }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ stats?.returningVisitors ?? 0 }} povratnih</p>
          </div>
          <div class="rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
            <p class="text-xs uppercase tracking-wider text-gray-400">Novi posjetitelji</p>
            <p class="mt-2 text-3xl font-bold">{{ stats?.newVisitors ?? '—' }}</p>
            <p class="mt-1 text-xs text-gray-500">prvi put viđeni</p>
          </div>
          <div class="rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
            <p class="text-xs uppercase tracking-wider text-gray-400">Bot promet</p>
            <p class="mt-2 text-3xl font-bold">{{ stats?.botPct ?? 0 }}%</p>
            <p class="mt-1 text-xs text-gray-500">{{ stats?.bots ?? 0 }} zahtjeva</p>
          </div>
        </section>

        <p v-if="stats?.capped" class="mt-3 text-xs text-taxi-yellow/80">
          Prikazano prvih {{ 2000 }} događaja u prozoru (ograničenje za brzinu API-ja).
        </p>

        <!-- By-day chart -->
        <section class="mt-6 rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
          <h2 class="mb-4 text-sm font-semibold text-gray-300">Posjete po danu</h2>
          <div class="flex h-40 items-end gap-1">
            <div
              v-for="bar in stats?.byDay ?? []"
              :key="bar.date"
              class="group relative flex-1"
              :title="`${bar.date}: ${bar.count}`"
            >
              <div
                class="w-full rounded-t bg-taxi-yellow/70 transition group-hover:bg-taxi-yellow"
                :style="{ height: barHeight(bar.count) }"
              />
            </div>
          </div>
          <div class="mt-2 flex justify-between text-[10px] text-gray-500">
            <span>{{ (stats?.byDay ?? [])[0]?.date }}</span>
            <span>{{ (stats?.byDay ?? []).at(-1)?.date }}</span>
          </div>
        </section>

        <!-- Top pages + countries -->
        <section class="mt-6 grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
            <h2 class="mb-4 text-sm font-semibold text-gray-300">Najčešće odredišne stranice</h2>
            <ul class="space-y-2">
              <li v-for="p in stats?.topPages ?? []" :key="p.label" class="flex items-center justify-between text-sm">
                <span class="truncate pr-3 text-gray-300">{{ p.label }}</span>
                <span class="font-semibold text-taxi-yellow">{{ p.count }}</span>
              </li>
              <li v-if="!(stats?.topPages?.length)" class="text-sm text-gray-500">Nema podataka.</li>
            </ul>
          </div>
          <div class="rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
            <h2 class="mb-4 text-sm font-semibold text-gray-300">Po državi</h2>
            <ul class="space-y-2">
              <li v-for="c in stats?.byCountry ?? []" :key="c.label" class="flex items-center justify-between text-sm">
                <span class="truncate pr-3 text-gray-300">{{ c.label }}</span>
                <span class="font-semibold text-taxi-yellow">{{ c.count }}</span>
              </li>
              <li v-if="!(stats?.byCountry?.length)" class="text-sm text-gray-500">Nema podataka.</li>
            </ul>
          </div>
        </section>

        <!-- Recent visits table -->
        <section class="mt-6 rounded-2xl border border-taxi-light bg-taxi-gray/50 p-5">
          <h2 class="mb-4 text-sm font-semibold text-gray-300">Nedavne posjete</h2>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-left text-sm">
              <thead class="text-xs uppercase tracking-wider text-gray-500">
                <tr class="border-b border-taxi-light">
                  <th class="py-2 pr-3 font-medium">Vrijeme</th>
                  <th class="py-2 pr-3 font-medium">Posjetitelj</th>
                  <th class="py-2 pr-3 font-medium">Lokacija</th>
                  <th class="py-2 pr-3 font-medium">Uređaj</th>
                  <th class="py-2 pr-3 font-medium">Stranica</th>
                  <th class="py-2 pr-3 font-medium">Izvor</th>
                  <th class="py-2 pr-3 font-medium">Bot</th>
                  <th class="py-2 pr-0 font-medium text-right">Pouzdanost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rows" :key="r.requestId" class="border-b border-taxi-light/40 hover:bg-taxi-light/20">
                  <td class="py-2 pr-3 whitespace-nowrap text-gray-400">{{ fmtTime(r.time) }}</td>
                  <td class="py-2 pr-3 font-mono text-xs text-gray-300">
                    {{ shortId(r.visitorId) }}
                    <span v-if="r.incognito" class="ml-1 text-[10px] text-gray-500">(incognito)</span>
                  </td>
                  <td class="py-2 pr-3 text-gray-300">
                    {{ [r.geo.city, r.geo.country].filter(Boolean).join(', ') || '—' }}
                    <span v-if="r.vpn" class="ml-1 rounded bg-orange-500/20 px-1 text-[10px] text-orange-300">VPN</span>
                  </td>
                  <td class="py-2 pr-3 text-gray-400">
                    <div>{{ r.browser || '—' }}</div>
                    <div class="text-xs text-gray-500">{{ r.os }}</div>
                  </td>
                  <td class="py-2 pr-3 max-w-[160px] truncate text-gray-300" :title="r.page.path || r.url || ''">
                    {{ r.page.path || '—' }}
                  </td>
                  <td class="py-2 pr-3 max-w-[160px] truncate text-gray-400" :title="sourceLabel(r)">
                    {{ sourceLabel(r) }}
                  </td>
                  <td class="py-2 pr-3">
                    <span class="rounded px-2 py-0.5 text-[10px] font-semibold" :class="botClass(r.bot)">
                      {{ botLabel(r.bot) }}
                    </span>
                  </td>
                  <td class="py-2 pr-0 text-right text-gray-400">
                    {{ r.confidence != null ? Math.round(r.confidence * 100) + '%' : '—' }}
                  </td>
                </tr>
                <tr v-if="!rows.length">
                  <td colspan="8" class="py-8 text-center text-gray-500">Još nema zabilježenih posjeta.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="paginationKey" class="mt-4 text-center">
            <button
              class="rounded-full border border-taxi-light px-5 py-2 text-sm text-gray-300 transition hover:border-taxi-yellow hover:text-white disabled:opacity-60"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? 'Učitavanje…' : 'Učitaj još' }}
            </button>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Nadzorna ploča — Taxi Zagreb' })

const days = ref(7)

const { data: stats } = await useFetch<any>('/api/dashboard/stats', {
  query: { days },
})

const { data: initialEvents } = await useFetch<any>('/api/dashboard/events', {
  query: { limit: 25 },
})

const rows = ref<any[]>(initialEvents.value?.rows ?? [])
const paginationKey = ref<string | null>(initialEvents.value?.paginationKey ?? null)
const loadingMore = ref(false)

async function loadMore() {
  if (!paginationKey.value) return
  loadingMore.value = true
  try {
    const res = await $fetch<any>('/api/dashboard/events', {
      query: { limit: 25, paginationKey: paginationKey.value },
    })
    rows.value.push(...(res.rows ?? []))
    paginationKey.value = res.paginationKey ?? null
  } finally {
    loadingMore.value = false
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  await navigateTo('/login')
}

const maxByDay = computed(() => Math.max(1, ...(stats.value?.byDay ?? []).map((d: any) => d.count)))
function barHeight(count: number): string {
  return `${Math.max(2, Math.round((count / maxByDay.value) * 100))}%`
}

function fmtTime(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortId(id: string): string {
  return id ? id.slice(0, 10) + '…' : '—'
}

function sourceLabel(r: any): string {
  const utm = r.page?.utm
  if (utm && Object.keys(utm).length) {
    return Object.entries(utm)
      .map(([k, v]) => `${k}:${v}`)
      .join(' · ')
  }
  if (r.page?.referrer) {
    try {
      return new URL(r.page.referrer).hostname
    } catch {
      return r.page.referrer
    }
  }
  return 'izravno'
}

function botLabel(bot: string | null): string {
  if (bot === 'bad') return 'BOT'
  if (bot === 'good') return 'dobar bot'
  if (bot === 'notDetected') return 'čovjek'
  return '—'
}

function botClass(bot: string | null): string {
  if (bot === 'bad') return 'bg-red-500/20 text-red-300'
  if (bot === 'good') return 'bg-blue-500/20 text-blue-300'
  if (bot === 'notDetected') return 'bg-green-500/20 text-green-300'
  return 'bg-taxi-light text-gray-400'
}
</script>
