import { verifySession, ADMIN_COOKIE } from '../utils/session'

/**
 * Gates the admin dashboard page and its data APIs behind a valid session cookie.
 * Everything else (public site, /api/identify, /api/auth/*) passes through.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  const isDashboardPage = path === '/dashboard' || path.startsWith('/dashboard/')
  const isDashboardApi = path.startsWith('/api/dashboard')
  if (!isDashboardPage && !isDashboardApi) return

  const sessionSecret = useRuntimeConfig(event).sessionSecret as string
  const token = getCookie(event, ADMIN_COOKIE)

  if (sessionSecret && verifySession(token, sessionSecret)) return // authenticated

  if (isDashboardApi) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return sendRedirect(event, '/login', 302)
})
