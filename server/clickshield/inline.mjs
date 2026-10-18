// @ts-check
/**
 * ClickShield's tracker inline on the ad landings: the pure half of
 * server/plugins/clickshield-inline.ts (no Nitro, no Nuxt), so `node --test` covers it. The same
 * file in tim-taxi-zagreb and alen-taxi-zagreb.
 *
 * Every page loads cs.js with the `<script src>` in nuxt.config.ts. On an ad landing, and on an
 * install test link, the plugin replaces that tag in place with a copy of the bytes ClickShield
 * serves, so the click-ping leaves while the browser reads the head instead of after a download
 * from another origin. Rendering reads the copy this instance holds and refreshes run in the
 * background; the only pages that wait are ad landings rendered before the instance's first
 * answer from ClickShield (FIRST_ANSWER_WAIT_MS). Whatever goes wrong, the page keeps the `src`
 * tag it has today. ClickShield's side of it: docs/tracker.md, "An inline copy".
 */
import { createHash } from 'node:crypto'

/** How long a copy is fresh: ClickShield's `max-age` for /cs.js. */
export const FRESH_MS = 300_000

/** How long one refresh may take, body included. This frees a hung one; no page waits that long. */
export const FETCH_TIMEOUT_MS = 10_000

/**
 * How long an ad landing rendered before the instance's first answer waits for it: the ad click
 * that starts an instance (on a site that sleeps between ad clicks, most of them). Its render and
 * the boot fetch end together (on TIM the fetch came back 13-70 ms after the render), so without
 * the wait the page gets the src tag. A bundled snapshot would need no wait, but ClickShield's
 * changes (a fix, a stop, a new key) would not reach those pages until the next taxi deploy.
 */
export const FIRST_ANSWER_WAIT_MS = 1_000

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
 *   body?: ReadableStream<Uint8Array> | null,
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
 * only `true`, `'true'` or `'on'`. Nuxt parses the env value first (destr): `false` (any case),
 * `off`, `0` and an empty value turn it off; `null` and `undefined` keep the config default (on).
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
 * The text of `response`'s body, read within `msLeft` and at most MAX_COPY_BYTES decoded bytes;
 * null when it is larger (counted after decompression, so a compressed bomb stops early). Throws
 * when the time runs out. Node's fetch may stop following the request's AbortSignal once the
 * headers are in (undici drops that listener after a GC), so a body that stalls would keep a
 * plain text() waiting for undici's own 300 s body timeout: the reader is cancelled by a timer of
 * its own. A read cancelled that way resolves as done, so `late`, not `done`, says whether the
 * text is whole.
 * @param {CopyResponse} response
 * @param {number} msLeft
 * @returns {Promise<string | null>}
 */
const readBody = async (response, msLeft) => {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let late = false
  const timer = setTimeout(() => {
    late = true
    reader.cancel().catch(() => undefined)
  }, Math.max(0, msLeft))
  try {
    let text = ''
    let bytes = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (late) throw new Error('the cs.js body did not arrive in time')
      if (done) return text + decoder.decode()
      bytes += value.byteLength
      if (bytes > MAX_COPY_BYTES) {
        await reader.cancel().catch(() => undefined)
        return null
      }
      text += decoder.decode(value, { stream: true })
    }
  } finally {
    clearTimeout(timer)
  }
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
 * - No answer (timeout, network error, redirect, another status or type, a body that does not
 *   arrive in time) keeps the copy held: an outage never takes the copy away. The next try waits
 *   30 s, doubling to every 5 minutes. A body over 32 KiB is read no further and counts as an
 *   answer that cannot run inline. To stop the copies on purpose, ClickShield serves a 200
 *   JavaScript body without data-cs-origin (or the hosts set NUXT_CLICKSHIELD_INLINE=false):
 *   a 404, 5xx or redirect reads as an outage.
 * - `current()` is what an ad landing gets now: the live copy, else the bundled fallback while
 *   ClickShield has not answered since boot and a try has failed (never while the first try is
 *   still out, so a normal cold start never serves an old snapshot), else null (the src tag).
 * - `firstAnswer(ms)` is what an ad landing rendered while the first try since boot is still out
 *   awaits before it reads `current()`: it resolves when that try ends, with an answer or a
 *   failure, or after `ms`, and at once when no first try is out. So ClickShield's answer, a stop
 *   included, decides that page too; after `ms` it gets the src tag, and so does every page after
 *   it without waiting until the try ends. Later tries are never waited for.
 *
 * @param {{
 *   url: string, fetch: CopyFetch, now: () => number, log: Log, userAgent: string,
 *   timeoutMs?: number,
 * }} options `timeoutMs` (default FETCH_TIMEOUT_MS) bounds the whole fetch, body included.
 */
export const createCopyHolder = ({
  url,
  fetch,
  now,
  log,
  userAgent,
  timeoutMs = FETCH_TIMEOUT_MS,
}) => {
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
  /** @type {Promise<void> | null} The try in flight, settling when it ends. */
  let running = null
  /** Whether a page has already waited the whole time for the first try: no page waits again. */
  let waitedOut = false
  let failures = 0
  let nextAt = bootAt
  let warnedAt = -Infinity
  let fallbackWarned = false

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
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'user-agent': userAgent },
      })
      const type = response.headers.get('content-type') ?? ''
      if (response.status !== 200 || !type.includes('javascript')) {
        await response.body?.cancel().catch(() => undefined)
        throw new Error(`HTTP ${response.status} ${type}`.trim())
      }
      const body = await readBody(response, timeoutMs - (now() - startedAt))
      answered = true
      failures = 0
      nextAt = now() + FRESH_MS
      if (body !== null && inlinable(body)) {
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
        const key = body === null ? 'too-large' : copyOf('live', body).label
        if (key !== refused) {
          log('WARNING', "ClickShield's cs.js cannot run inline: ad landings get the src tag", {
            bytes: body === null ? `over ${MAX_COPY_BYTES}` : Buffer.byteLength(body),
            dropped: live?.label ?? null,
          })
          refused = key
        }
        live = null
      }
    } catch (error) {
      failures += 1
      if (!answered) failedBeforeAnswer = true
      nextAt = now() + RETRY_MS[Math.min(failures, RETRY_MS.length) - 1]
      // INFO while a live copy is held (riding out an outage is its job); WARNING when ad landings
      // get the bundled fallback or the src tag instead. A redirect, DNS and TLS failure all read
      // 'fetch failed': the cause tells them apart.
      log(live ? 'INFO' : 'WARNING', 'cs.js not refreshed', {
        error: String(error),
        cause: error instanceof Error && error.cause !== undefined ? String(error.cause) : '',
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
      running = refresh().catch(() => undefined)
    },
    /**
     * Resolves when the first try since boot ends or after `ms`; at once when none is out, or
     * once a page has waited `ms` for it (a hung ClickShield then delays only the pages that
     * started waiting before that).
     * @param {number} ms
     * @returns {Promise<void>}
     */
    firstAnswer(ms) {
      if (answered || failedBeforeAnswer || waitedOut || !inflight || !running) return Promise.resolve()
      /** @type {ReturnType<typeof setTimeout> | undefined} */
      let timer
      const late = new Promise((resolve) => {
        timer = setTimeout(() => {
          waitedOut = true
          resolve(undefined)
        }, ms)
      })
      return Promise.race([running, late]).then(() => clearTimeout(timer))
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
      if (fallback && !answered && failedBeforeAnswer) {
        if (!fallbackWarned) {
          fallbackWarned = true
          log('WARNING', 'ad landings get the bundled fallback: ClickShield has not answered', {
            fallback: fallback.label,
          })
        }
        return { ...fallback, ageS: null }
      }
      return null
    },
  }
}
