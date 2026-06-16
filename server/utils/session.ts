import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Minimal signed-token helpers (HMAC-SHA256 over a base64url JSON payload).
 * Used for both the admin session cookie and the first-party visitor cookie.
 * No external auth dependency — Node's crypto only.
 */

export const ADMIN_COOKIE = 'taxi_admin'
export const FPV_COOKIE = '__fpv'

const ADMIN_TTL_MS = 1000 * 60 * 60 * 8 // 8 hours

function hmac(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

export function signToken(payload: Record<string, unknown>, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${hmac(body, secret)}`
}

export function verifyToken<T = Record<string, unknown>>(
  token: string | undefined | null,
  secret: string,
): T | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null

  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = hmac(body, secret)

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let payload: any
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (typeof payload?.exp === 'number' && payload.exp < Date.now()) return null
  return payload as T
}

/** Issue a signed admin-session token. */
export function signSession(secret: string): string {
  return signToken({ sub: 'admin', exp: Date.now() + ADMIN_TTL_MS }, secret)
}

/** True when the token is a valid, unexpired admin session. */
export function verifySession(token: string | undefined | null, secret: string): boolean {
  return verifyToken<{ sub?: string }>(token, secret)?.sub === 'admin'
}
