import { searchEvents, mapEvent, type VisitRow } from '../../utils/fingerprint'

/**
 * Protected (see server/middleware/auth.ts). Aggregates a window of events for
 * the dashboard cards/charts. Pages the Server API up to MAX_EVENTS and caches
 * the result ~60s per warm instance to respect Server API rate limits.
 */
const CACHE_TTL = 60_000
const MAX_EVENTS = 2000
const PAGE_SIZE = 100

let cache: { key: string; at: number; data: any } | null = null

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secretApiKey = config.fingerprintSecretApiKey as string
  const region = (config.public.fingerprintRegion as string) || 'eu'

  if (!secretApiKey) return { configured: false }

  const days = Math.min(Number(getQuery(event).days) || 7, 30)
  const cacheKey = `${days}`
  const now = Date.now()
  if (cache && cache.key === cacheKey && now - cache.at < CACHE_TTL) {
    return cache.data
  }

  const start = now - days * 24 * 60 * 60 * 1000
  const rows: VisitRow[] = []
  let paginationKey: string | undefined

  try {
    while (rows.length < MAX_EVENTS) {
      const { events, paginationKey: next } = await searchEvents(
        { limit: PAGE_SIZE, start, paginationKey },
        { secretApiKey, region },
      )
      for (const e of events) {
        const row = mapEvent(e)
        if (row) rows.push(row)
      }
      if (!next || events.length === 0) break
      paginationKey = next
    }
  } catch (err: any) {
    // Serve whatever we gathered rather than failing the whole dashboard.
    console.warn('[stats] partial fetch:', err?.statusCode || err?.message)
  }

  const data = aggregate(rows, days, start)
  cache = { key: cacheKey, at: now, data }
  return data
})

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function topN(map: Map<string, number>, n: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }))
}

function aggregate(rows: VisitRow[], days: number, start: number) {
  const uniq = new Set<string>()
  const newIds = new Set<string>()
  const returningIds = new Set<string>()
  let bots = 0
  const pages = new Map<string, number>()
  const countries = new Map<string, number>()
  const byDay = new Map<string, number>()

  // Pre-seed continuous day buckets so the chart has no gaps.
  for (let i = 0; i < days; i++) {
    byDay.set(dayKey(new Date(start + i * 86_400_000)), 0)
  }

  for (const r of rows) {
    uniq.add(r.visitorId)
    if (r.firstSeenAt == null || r.firstSeenAt >= start) newIds.add(r.visitorId)
    else returningIds.add(r.visitorId)

    if (r.bot === 'bad') bots++

    const page = r.page.path || r.url || '(nepoznato)'
    pages.set(page, (pages.get(page) || 0) + 1)

    const country = r.geo.country || '(nepoznato)'
    countries.set(country, (countries.get(country) || 0) + 1)

    const k = dayKey(new Date(r.time))
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) || 0) + 1)
  }

  // A visitor counted as new must not also count as returning.
  for (const id of newIds) returningIds.delete(id)

  return {
    configured: true,
    days,
    total: rows.length,
    uniqueVisitors: uniq.size,
    newVisitors: newIds.size,
    returningVisitors: returningIds.size,
    bots,
    botPct: rows.length ? Math.round((bots / rows.length) * 100) : 0,
    capped: rows.length >= MAX_EVENTS,
    topPages: topN(pages, 8),
    byCountry: topN(countries, 8),
    byDay: [...byDay.entries()].map(([date, count]) => ({ date, count })),
  }
}
