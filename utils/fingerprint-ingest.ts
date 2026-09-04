/**
 * Delivery helpers for the two ClickShield beacons an ad landing sends:
 *  1. the instant click-ping (`/api/fingerprint/click`) — fired on every
 *     ad-marked document before anything else, so even a ~0.2s bounce leaves a
 *     record;
 *  2. the ingest (`/api/fingerprint/ingest`) — the Fingerprint requestId once
 *     `fp.get()` has finished.
 * Both go out as `text/plain` — CORS-safelisted, so a single request with no
 * preflight round trip (ClickShield parses it as JSON) — via sendBeacon with a
 * keepalive fetch fallback, so they survive an immediate tab close.
 */

const DEVICE_TOKEN_KEY = 'cs_device_token'

/** RFC 4122 v4 id that never throws (randomUUID → getRandomValues → Math.random). */
function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // insecure context / old WebView — fall through
  }
  let bytes: number[]
  try {
    bytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
  } catch {
    bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256))
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * First-party persistent device id — survives Fingerprint visitorId rotation on
 * iOS. Sent as `fp.get({ linkedId })` and as `deviceToken` on the click-ping, so
 * ClickShield can tie the pings of a device to its identification. Never throws
 * (falls back to an in-memory id when storage is blocked).
 */
export function getOrCreateDeviceToken(): string {
  let token: string | null = null
  try {
    token = localStorage.getItem(DEVICE_TOKEN_KEY)
  } catch {
    // storage blocked
  }
  if (!token) {
    token = uuid()
    try {
      localStorage.setItem(DEVICE_TOKEN_KEY, token)
    } catch {
      // ephemeral token for this document only
    }
  }
  return token
}

/** sendBeacon first (queued even if the tab closes), keepalive fetch otherwise. Never throws. */
function beacon(url: string, body: string, contentType: string): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon(url, new Blob([body], { type: contentType }))) return
    }
  } catch {
    // fall through to keepalive fetch
  }
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'content-type': contentType },
      credentials: 'omit',
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // fetch unavailable — nothing more to try
  }
}

const endpoint = (ingestBase: string, path: string) => `${ingestBase.replace(/\/$/, '')}${path}`

/** Deliver the Fingerprint requestId to ClickShield once identification finished. */
export function postIngest(
  ingestBase: string,
  payload: { requestId: string; gclid?: string | null },
): void {
  if (!ingestBase) return
  const body = JSON.stringify({
    requestId: payload.requestId,
    ...(payload.gclid ? { gclid: payload.gclid } : {}),
  })
  beacon(endpoint(ingestBase, '/api/fingerprint/ingest'), body, 'text/plain')
}

/**
 * Instant click-ping: registers the ad click in ClickShield BEFORE the
 * Fingerprint agent loads. `navigationType` tells ClickShield whether this is a
 * new ad click (`navigate` / `prerender`) or a re-show of the landing page
 * (`back_forward` / `reload` / `bfcache`) — the latter are stored but never
 * counted as clicks.
 */
export function postClickPing(
  ingestBase: string,
  payload: {
    gclid?: string | null
    deviceToken?: string
    path?: string
    referrer?: string | null
    lang?: string | null
    navigationType?: string
  },
): void {
  if (!ingestBase) return
  const body = JSON.stringify({
    gclid: payload.gclid || undefined,
    deviceToken: payload.deviceToken || undefined,
    path: payload.path || undefined,
    referrer: payload.referrer || undefined,
    lang: payload.lang || undefined,
    navigationType: payload.navigationType || undefined,
  })
  beacon(endpoint(ingestBase, '/api/fingerprint/click'), body, 'text/plain')
}
