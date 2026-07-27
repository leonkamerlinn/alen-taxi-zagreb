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
