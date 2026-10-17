// @ts-check
/**
 * ClickShield's tracker inline on the ad landings: the pure half of
 * server/plugins/clickshield-inline.ts (no Nitro, no Nuxt), so `node --test` covers it. The same
 * file in tim-taxi-zagreb and alen-taxi-zagreb.
 *
 * Every page loads cs.js with the `<script src>` in nuxt.config.ts. On an ad landing, and on an
 * install test link, the plugin replaces that tag in place with a copy of the bytes ClickShield
 * serves, so the click-ping leaves while the browser reads the head instead of after a download
 * from another origin. Rendering only reads the copy this instance holds; refreshes run in the
 * background. Whatever goes wrong, the page keeps the `src` tag it has today. ClickShield's side
 * of it: docs/tracker.md, "An inline copy".
 */
import { createHash } from 'node:crypto'

/** How long a copy is fresh: ClickShield's `max-age` for /cs.js. */
export const FRESH_MS = 300_000

/** How long one refresh may take. No page waits for a refresh; this only frees a hung one. */
export const FETCH_TIMEOUT_MS = 10_000

/** The waits after refreshes that got no answer: 30 s, doubling, then every 5 minutes. */
export const RETRY_MS = [30_000, 60_000, 120_000, 240_000, 300_000]

/** An instance that serves a copy this long without a successful refresh warns, once per window. */
export const STALE_WARN_MS = 6 * 3_600_000

/** The largest copy pasted into a page: four times ClickShield's 8 KiB budget for cs.js. */
export const MAX_COPY_BYTES = 32 * 1024

/**
 * The attribute an inline copy names its ClickShield origin with. Only builds of cs.js that read
 * it contain the literal, and an older cs.js run inline finds no address and sends nothing, so a
 * copy without it is never pasted in.
 */
export const MARKER = 'data-cs-origin'

/** The site's own label for the copy a page got; cs.js never reads it. */
export const COPY_ATTRIBUTE = 'data-cs-copy'

/** How unhead closes an empty `<script src>` element. */
const EMPTY_CLOSE = '></script>'

/** What would end the `<script>` early or change how the browser parses it. */
const UNSAFE = /<\/script|<script|<!--/i

/** One attribute of a rendered tag, as unhead writes it: ` name` or ` name="value"`. */
const ATTRIBUTE = /\s+([^\s"'=<>/]+)(?:="[^"]*")?/g

/** Whether an attribute of the src tag stays on the inline copy: cs.js's options, a CSP nonce. */
const keeps = (/** @type {string} */ name) =>
  name === 'nonce' || (name.startsWith('data-') && name !== MARKER && name !== COPY_ATTRIBUTE)

/**
 * @typedef {'INFO' | 'WARNING'} Severity
 * @typedef {(severity: Severity, message: string, fields?: Record<string, unknown>) => void} Log
 * @typedef {{ readonly body: string, readonly label: string }} Copy
 * @typedef {Copy & { readonly ageS: number | null }} HeldCopy
 * @typedef {{
 *   status: number,
 *   headers: { get(name: string): string | null },
 *   text(): Promise<string>,
 *   body?: { cancel(): Promise<void> } | null,
 * }} CopyResponse
 * @typedef {(
 *   url: string,
 *   init: { redirect: 'error', signal: AbortSignal, headers: Record<string, string> },
 * ) => Promise<CopyResponse>} CopyFetch
 */

/**
 * One structured log line on stdout. Cloud Logging reads `severity` and `message` from it.
 * @type {Log}
 */
export const logLine = (severity, message, fields = {}) => {
  console.log(JSON.stringify({ severity, message: `[clickshield] ${message}`, ...fields }))
}

/**
 * Whether the switch (`runtimeConfig.clickshield.inline`, env `NUXT_CLICKSHIELD_INLINE`) is on:
 * only `true`, `'true'` or `'on'`. Anything else is off, so an unclear value keeps the src tag.
 * @param {unknown} value
 */
export const inlineMode = (value) => value === true || value === 'true' || value === 'on'

/**
 * Whether `body` may be pasted into a page: at most 32 KiB, holds the marker, and nothing that
 * would end the script early.
 * @param {unknown} body
 * @returns {body is string}
 */
export const inlinable = (body) =>
  typeof body === 'string' &&
  Buffer.byteLength(body) <= MAX_COPY_BYTES &&
  body.includes(MARKER) &&
  !UNSAFE.test(body)

/**
 * `body` with its label: where it came from, then the first 12 characters of its SHA-256 in
 * base64url, the same hash ClickShield's ETag for /cs.js carries.
 * @param {'live' | 'fallback'} source
 * @param {string} body
 * @returns {Copy}
 */
export const copyOf = (source, body) => ({
  body,
  label: `${source}:${createHash('sha256').update(body).digest('base64url').slice(0, 12)}`,
})

/**
 * What a storage read returned, as text (the server assets answer a string, a dev disk read a
 * Buffer); '' for anything else.
 * @param {unknown} raw
 */
export const textOf = (raw) => {
  if (typeof raw === 'string') return raw
  if (raw instanceof Uint8Array) return Buffer.from(raw).toString('utf8')
  return ''
}

/**
 * Which pages get the inline copy: 'test' for an install test link (`?cs_test=<token>`, so
 * "Test the install" checks what ad landings run), 'ad' for an ad landing (`isAd`, the site's
 * own rule, the same as cs.js's), null for every other page, error pages included (they render
 * under `/__nuxt_error?url=…`, whose own query holds no ad parameter).
 * @param {string} path the request path with its query (`event.path`)
 * @param {(query: URLSearchParams) => boolean} isAd
 * @returns {'test' | 'ad' | null}
 */
export const landingKind = (path, isAd) => {
  const at = path.indexOf('?')
  const query = new URLSearchParams(at < 0 ? '' : path.slice(at + 1))
  if (query.get('cs_test')) return 'test'
  return isAd(query) ? 'ad' : null
}

/**
 * `chunk`, a piece of the rendered `<head>`, with its `<script … src="<src>" …></script>`
 * replaced by `copy` inline; null when it holds no such tag of the expected shape.
 *
 * The inline tag keeps the old tag's `data-*` attributes and `nonce` as written, drops `src`,
 * `async` and `fetchpriority`, and adds `data-cs-origin` (where cs.js sends its beacons) and
 * `data-cs-copy`. It takes the old tag's place, so it stays after charset and title and before
 * every stylesheet: an inline script after a stylesheet would wait for that stylesheet. Only the
 * first match is replaced, and only by slicing, never with String#replace: cs.js holds `$`
 * characters that a replacement string would read as patterns.
 * @param {string} chunk
 * @param {string} src
 * @param {Copy} copy
 * @returns {string | null}
 */
export const swapTag = (chunk, src, copy) => {
  const at = chunk.indexOf(` src="${src}"`)
  if (at < 0) return null
  const start = chunk.lastIndexOf('<script', at)
  const close = chunk.indexOf(EMPTY_CLOSE, at)
  if (start < 0 || close < 0) return null
  const attributes = chunk.slice(start + '<script'.length, close)
  if (attributes.includes('<') || attributes.includes('>')) return null
  const parsed = [...attributes.matchAll(ATTRIBUTE)]
  // Every character must belong to an attribute: anything else is a shape this code does not know.
  if (parsed.map(([text]) => text).join('') !== attributes) return null
  const kept = parsed
    .filter(([, name]) => keeps(name))
    .map(([text]) => text)
    .join('')
  const origin = new URL(src).origin
  const opening = `<script ${MARKER}="${origin}" ${COPY_ATTRIBUTE}="${copy.label}"${kept}>`
  const after = chunk.slice(close + EMPTY_CLOSE.length)
  return chunk.slice(0, start) + opening + copy.body + '</script>' + after
}

/**
 * Swaps the first chunk of `head` (Nitro's `htmlContext.head`, changed in place) that holds the
 * cs.js tag, and says what happened.
 * @param {string[]} head
 * @param {string} src
 * @param {Copy | null} copy
 * @returns {'inlined' | 'no-copy' | 'no-tag'}
 */
export const inlineHead = (head, src, copy) => {
  if (!copy) return 'no-copy'
  for (let index = 0; index < head.length; index++) {
    const swapped = swapTag(head[index], src, copy)
    if (swapped !== null) {
      head[index] = swapped
      return 'inlined'
    }
  }
  return 'no-tag'
}

/**
 * The copy of cs.js one server instance holds, and its refreshes.
 *
 * - `refreshIfDue()` starts a refresh when the copy is due: at boot, then at the start of the
 *   first request after it (Cloud Run gives an instance CPU only while it serves a request, so
 *   never on a timer). One refresh at a time; it never throws and is never awaited.
 * - A 200 with a JavaScript type is ClickShield's final answer: bytes that can run inline become
 *   the live copy; any others drop it, so a ClickShield revert reaches the ad landings.
 * - No answer (timeout, network error, redirect, another status or type) keeps the copy held:
 *   an outage never takes the copy away. The next try waits 30 s, doubling to every 5 minutes.
 * - `current()` is what an ad landing gets now: the live copy, else the bundled fallback while
 *   ClickShield has not answered since boot and a try has failed (never while the first try is
 *   still out, so a normal cold start never serves an old snapshot), else null (the src tag).
 *
 * @param {{
 *   url: string, fetch: CopyFetch, now: () => number, log: Log, userAgent: string,
 * }} options
 */
export const createCopyHolder = ({ url, fetch, now, log, userAgent }) => {
  const bootAt = now()
  /** @type {(Copy & { fetchedAt: number }) | null} */
  let live = null
  /** @type {Copy | null} */
  let fallback = null
  /** The hash of the last answer that could not run inline, to warn once per such answer. */
  let refused = ''
  let answered = false
  let failedBeforeAnswer = false
  let inflight = false
  let failures = 0
  let nextAt = bootAt
  let warnedAt = -Infinity

  const hashOf = (/** @type {Copy} */ copy) => copy.label.slice(copy.label.indexOf(':') + 1)

  /** The copy served when no refresh succeeds for long: warn once per window. */
  const warnIfStale = () => {
    const held = live ?? (answered ? null : fallback)
    if (!held) return
    const since = live ? live.fetchedAt : bootAt
    if (now() - since < STALE_WARN_MS || now() - warnedAt < STALE_WARN_MS) return
    warnedAt = now()
    log('WARNING', 'no successful cs.js refresh for 6 hours: ad landings keep an old copy', {
      copy: held.label,
      ageS: Math.round((now() - since) / 1000),
    })
  }

  const refresh = async () => {
    inflight = true
    const startedAt = now()
    try {
      const response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'user-agent': userAgent },
      })
      const type = response.headers.get('content-type') ?? ''
      if (response.status !== 200 || !type.includes('javascript')) {
        await response.body?.cancel().catch(() => undefined)
        throw new Error(`HTTP ${response.status} ${type}`.trim())
      }
      const body = await response.text()
      answered = true
      failures = 0
      nextAt = now() + FRESH_MS
      if (inlinable(body)) {
        const next = { ...copyOf('live', body), fetchedAt: now() }
        if (live?.label !== next.label) {
          log('INFO', 'copy updated', {
            from: live?.label ?? null,
            to: next.label,
            fallback: fallback?.label ?? null,
            fallbackCurrent: fallback ? hashOf(fallback) === hashOf(next) : null,
          })
        }
        live = next
        refused = ''
      } else {
        const hash = copyOf('live', body).label
        if (hash !== refused) {
          log('WARNING', "ClickShield's cs.js cannot run inline: ad landings get the src tag", {
            bytes: Buffer.byteLength(body),
            dropped: live?.label ?? null,
          })
          refused = hash
        }
        live = null
      }
    } catch (error) {
      failures += 1
      if (!answered) failedBeforeAnswer = true
      nextAt = now() + RETRY_MS[Math.min(failures, RETRY_MS.length) - 1]
      log('INFO', 'cs.js not refreshed', {
        error: String(error),
        ms: now() - startedAt,
        holds: live?.label ?? (!answered && fallback ? fallback.label : null),
        retryInS: Math.round((nextAt - now()) / 1000),
      })
      warnIfStale()
    } finally {
      inflight = false
    }
  }

  return {
    /** Starts a refresh when one is due and none is running. */
    refreshIfDue() {
      if (inflight || now() < nextAt) return
      refresh().catch(() => undefined)
    },
    /**
     * The bundled snapshot, used only while ClickShield has not answered since boot.
     * @param {string} text
     */
    setFallback(text) {
      if (!inlinable(text)) {
        log('WARNING', 'the bundled fallback cannot run inline: none is used', {
          bytes: Buffer.byteLength(text),
        })
        return
      }
      fallback = copyOf('fallback', text)
      log('INFO', 'bundled fallback loaded', { fallback: fallback.label })
    },
    /** @returns {HeldCopy | null} */
    current() {
      if (live) return { ...live, ageS: Math.round((now() - live.fetchedAt) / 1000) }
      if (fallback && !answered && failedBeforeAnswer) return { ...fallback, ageS: null }
      return null
    },
  }
}
