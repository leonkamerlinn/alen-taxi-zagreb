/**
 * Deliver a ClickShield ingest payload in a way that survives short tab closes.
 * Prefer sendBeacon; fall back to fetch with keepalive (plain await fetch is
 * cancelled on unload and misses sub-1s ad bounces).
 */
export function postIngest(
  ingestBase: string,
  payload: { requestId: string; gclid?: string | null },
): void {
  if (!ingestBase) return
  const url = `${ingestBase.replace(/\/$/, '')}/api/fingerprint/ingest`
  const body = JSON.stringify({
    requestId: payload.requestId,
    ...(payload.gclid ? { gclid: payload.gclid } : {}),
  })

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      if (ok) return
    }
  } catch {
    // fall through to keepalive fetch
  }

  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'omit',
    body,
    keepalive: true,
  }).catch(() => {})
}

/**
 * Instant click-ping: registers the ad click in ClickShield BEFORE the
 * Fingerprint agent loads, so even a ~0.2s bounce leaves a record. Sent as
 * text/plain — CORS-safelisted, so the beacon goes out in a single request
 * with no preflight round trip — and survives an immediate tab close.
 */
export function postClickPing(
  ingestBase: string,
  payload: {
    gclid?: string | null
    deviceToken?: string
    path?: string
    referrer?: string | null
    lang?: string | null
  },
): void {
  if (!ingestBase) return
  const url = `${ingestBase.replace(/\/$/, '')}/api/fingerprint/click`
  const body = JSON.stringify({
    gclid: payload.gclid || undefined,
    deviceToken: payload.deviceToken || undefined,
    path: payload.path || undefined,
    referrer: payload.referrer || undefined,
    lang: payload.lang || undefined,
  })

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))
      if (ok) return
    }
  } catch {
    // fall through to keepalive fetch
  }

  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    credentials: 'omit',
    body,
    keepalive: true,
  }).catch(() => {})
}
