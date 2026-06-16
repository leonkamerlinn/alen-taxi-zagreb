import { getEvent } from '../utils/fingerprint'
import { rateLimit } from '../utils/rateLimit'
import { signToken, FPV_COOKIE } from '../utils/session'

/**
 * Backend identification ("the accurate path").
 *
 * The browser sends the short-lived `requestId` from `fp.get()`. We look the
 * event up server-side with the Secret API key — the authoritative, tamper-proof
 * result — and set a first-party, signed, httpOnly cookie carrying the verified
 * visitorId so SSR can recognise returning visitors without trusting the client.
 *
 * The full Server-API payload is never echoed back to the browser.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secretApiKey = config.fingerprintSecretApiKey as string
  const sessionSecret = config.sessionSecret as string
  const region = (config.public.fingerprintRegion as string) || 'eu'

  // Best-effort per-IP rate limit (60 req / minute).
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!rateLimit(`identify:${ip}`, 60, 60_000)) {
    setResponseStatus(event, 429)
    return { ok: false }
  }

  // Not configured yet → no-op so the public site keeps working.
  if (!secretApiKey) {
    return { ok: false, reason: 'not-configured' }
  }

  const body = await readBody<{ requestId?: string }>(event)
  const requestId = body?.requestId
  if (!requestId || typeof requestId !== 'string') {
    setResponseStatus(event, 400)
    return { ok: false, reason: 'missing-requestId' }
  }

  try {
    const raw = await getEvent(requestId, { secretApiKey, region })
    const visitorId = raw?.products?.identification?.data?.visitorId as string | undefined

    if (visitorId && sessionSecret) {
      const token = signToken(
        { vid: visitorId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 },
        sessionSecret,
      )
      setCookie(event, FPV_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    return { ok: true }
  } catch (err: any) {
    // 404 (expired/unknown requestId), 403 (key/region mismatch), 429 (rate limit):
    // log and degrade gracefully — never break the visitor's page.
    console.warn('[identify] Server API lookup failed:', err?.statusCode || err?.message || err)
    return { ok: false }
  }
})
