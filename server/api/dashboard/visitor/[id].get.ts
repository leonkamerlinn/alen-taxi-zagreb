import { searchEvents, mapEvent } from '../../../utils/fingerprint'

/** Protected (see server/middleware/auth.ts). Full event timeline for one visitor. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secretApiKey = config.fingerprintSecretApiKey as string
  const region = (config.public.fingerprintRegion as string) || 'eu'

  if (!secretApiKey) return { configured: false, visitorId: null, rows: [] }

  const visitorId = getRouterParam(event, 'id')
  if (!visitorId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing visitor id' })
  }

  try {
    const { events } = await searchEvents(
      { visitorId, limit: 100 },
      { secretApiKey, region },
    )
    const rows = events.map(mapEvent).filter(Boolean)
    return { configured: true, visitorId, rows }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Fingerprint API error',
      data: { detail: err?.statusCode ?? err?.message },
    })
  }
})
