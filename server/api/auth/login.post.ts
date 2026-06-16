import { createHash, timingSafeEqual } from 'node:crypto'
import { signSession, ADMIN_COOKIE } from '../../utils/session'
import { rateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const adminPassword = config.adminPassword as string
  const sessionSecret = config.sessionSecret as string

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: 'Previše pokušaja. Pokušajte kasnije.' })
  }

  if (!adminPassword || !sessionSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Auth not configured' })
  }

  const body = await readBody<{ password?: string }>(event)

  // Constant-time compare over fixed-length SHA-256 digests (also hides length).
  const given = createHash('sha256').update(body?.password ?? '').digest()
  const expected = createHash('sha256').update(adminPassword).digest()
  if (!timingSafeEqual(given, expected)) {
    throw createError({ statusCode: 401, statusMessage: 'Neispravna lozinka' })
  }

  setCookie(event, ADMIN_COOKIE, signSession(sessionSecret), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return { ok: true }
})
