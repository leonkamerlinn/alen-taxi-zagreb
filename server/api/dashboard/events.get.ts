import { searchEvents, mapEvent } from '../../utils/fingerprint'

/** Protected (see server/middleware/auth.ts). Paginated recent identifications. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secretApiKey = config.fingerprintSecretApiKey as string
  const region = (config.public.fingerprintRegion as string) || 'eu'

  if (!secretApiKey) return { configured: false, rows: [], paginationKey: null }

  const q = getQuery(event)
  const limit = Math.min(Number(q.limit) || 25, 100)
  const paginationKey = typeof q.paginationKey === 'string' ? q.paginationKey : undefined

  try {
    const { events, paginationKey: next } = await searchEvents(
      { limit, paginationKey },
      { secretApiKey, region },
    )
    const rows = events.map(mapEvent).filter(Boolean)
    return { configured: true, rows, paginationKey: next }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Fingerprint API error',
      data: { detail: err?.statusCode ?? err?.message },
    })
  }
})
