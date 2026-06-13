/**
 * Thin wrappers over the Fingerprint Pro Server API (REST, no SDK dependency).
 *   getEvent     → GET /events/{requestId}   (validate one identification)
 *   searchEvents → GET /events/search        (list / aggregate for the dashboard)
 * Both authenticate with the `Auth-API-Key: <secret>` header.
 *
 * The region MUST match the workspace region used by the browser agent, or the
 * API returns 404. We read it from the same runtime config value.
 */

export type FpRegion = 'eu' | 'us' | 'ap' | string

export interface FpConfig {
  secretApiKey: string
  region: FpRegion
}

export interface VisitRow {
  requestId: string
  visitorId: string
  visitorFound: boolean
  confidence: number | null
  time: number // ms epoch
  ip: string | null
  geo: { country: string | null; countryCode: string | null; city: string | null }
  browser: string | null
  os: string | null
  device: string | null
  bot: 'notDetected' | 'good' | 'bad' | null
  botType: string | null
  incognito: boolean | null
  vpn: boolean | null
  firstSeenAt: number | null // ms epoch (global), null = first ever seen
  url: string | null
  page: {
    path: string | null
    referrer: string | null
    utm: Record<string, string> | null
    lang: string | null
  }
}

function baseUrl(region: FpRegion): string {
  switch (region) {
    case 'eu':
      return 'https://eu.api.fpjs.io'
    case 'ap':
      return 'https://ap.api.fpjs.io'
    default:
      return 'https://api.fpjs.io'
  }
}

function parseFpTime(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const t = Date.parse(value)
    return Number.isNaN(t) ? null : t
  }
  return null
}

/** Validate a single identification by its requestId. Returns the raw Server API payload. */
export async function getEvent(requestId: string, cfg: FpConfig): Promise<any> {
  return await $fetch(`${baseUrl(cfg.region)}/events/${encodeURIComponent(requestId)}`, {
    headers: { 'Auth-API-Key': cfg.secretApiKey },
  })
}

export interface SearchParams {
  limit?: number
  start?: number // ms epoch
  end?: number // ms epoch
  bot?: 'all' | 'good' | 'bad' | 'none'
  visitorId?: string
  paginationKey?: string
}

/** Search recent identification events. Returns raw events + the next pagination key. */
export async function searchEvents(
  params: SearchParams,
  cfg: FpConfig,
): Promise<{ events: any[]; paginationKey: string | null }> {
  const query: Record<string, any> = {}
  if (params.limit) query.limit = params.limit
  if (params.start) query.start = params.start
  if (params.end) query.end = params.end
  if (params.bot) query.bot = params.bot
  if (params.visitorId) query.visitor_id = params.visitorId
  if (params.paginationKey) query.pagination_key = params.paginationKey

  const res: any = await $fetch(`${baseUrl(cfg.region)}/events/search`, {
    headers: { 'Auth-API-Key': cfg.secretApiKey },
    query,
  })
  return { events: res?.events ?? [], paginationKey: res?.paginationKey ?? null }
}

/** Normalize a raw Server API event into a flat row for the dashboard. */
export function mapEvent(event: any): VisitRow | null {
  const products = event?.products
  const ident = products?.identification?.data
  if (!ident?.requestId || !ident?.visitorId) return null

  const tag = ident.tag ?? {}
  const ipInfo = products?.ipInfo?.data
  const geo = ipInfo?.v4?.geolocation ?? ipInfo?.v6?.geolocation ?? ident.ipLocation ?? null
  const bd = ident.browserDetails ?? {}

  const browserVersion = bd.browserMajorVersion ?? bd.browserFullVersion ?? ''
  const osVersion = bd.osVersion ?? ''

  return {
    requestId: ident.requestId,
    visitorId: ident.visitorId,
    visitorFound: !!ident.visitorFound,
    confidence: ident.confidence?.score ?? null,
    time: parseFpTime(ident.timestamp ?? ident.time) ?? 0,
    ip: ident.ip ?? null,
    geo: {
      country: geo?.country?.name ?? null,
      countryCode: geo?.country?.code ?? null,
      city: geo?.city?.name ?? null,
    },
    browser: bd.browserName ? `${bd.browserName} ${browserVersion}`.trim() : null,
    os: bd.os ? `${bd.os} ${osVersion}`.trim() : null,
    device: bd.device ?? null,
    bot: products?.botd?.data?.bot?.result ?? null,
    botType: products?.botd?.data?.bot?.type ?? null,
    incognito: ident.incognito ?? null,
    vpn: products?.vpn?.data?.result ?? null,
    firstSeenAt: parseFpTime(ident.firstSeenAt?.global),
    url: ident.url ?? null,
    page: {
      path: tag.path ?? null,
      referrer: tag.referrer ?? null,
      utm: tag.utm ?? null,
      lang: tag.lang ?? null,
    },
  }
}
