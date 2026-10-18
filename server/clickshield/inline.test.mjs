// node --test server/clickshield/inline.test.mjs (the Dockerfile runs it before the build, so a
// failing case stops the deploy). No dependencies: node:test and node:assert only. The same file
// in tim-taxi-zagreb and alen-taxi-zagreb.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  copyOf,
  createCopyHolder,
  FRESH_MS,
  inlinable,
  inlineHead,
  inlineMode,
  landingKind,
  MAX_COPY_BYTES,
  RETRY_MS,
  STALE_WARN_MS,
  swapTag,
  textOf,
} from './inline.mjs'
import { CS_JS_URL } from './source.mjs'

const ORIGIN = 'https://clickshield-web-370434332956.europe-west4.run.app'

/** The cs.js tag of each site as it rendered live on 2026-10-17, with what comes before and after. */
const TIM_TAG =
  `<script src="${CS_JS_URL}" async fetchpriority="high"` +
  ' data-fp-agent="https://metrics.zagrebtaxizagreb.com/agent-fyatwbypklm5"' +
  ' data-fp-endpoint="https://metrics.zagrebtaxizagreb.com/result-wrpuw4ou4zff?region=eu"></script>'
const ALEN_TAG =
  `<script src="${CS_JS_URL}" async fetchpriority="high"` +
  ' data-fp-agent="https://metrics.taxizagreb24.com/agent-m0zfpmtcwbpc"' +
  ' data-fp-endpoint="https://metrics.taxizagreb24.com/result-8ckw7w2h3ebt?region=eu"></script>'
const HEADS = {
  tim: {
    before:
      '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>Zagreb Taxi - Profesionalni taxi prijevoz</title>\n',
    tag: TIM_TAG,
    after: '\n<style>',
    options:
      ' data-fp-agent="https://metrics.zagrebtaxizagreb.com/agent-fyatwbypklm5"' +
      ' data-fp-endpoint="https://metrics.zagrebtaxizagreb.com/result-wrpuw4ou4zff?region=eu"',
  },
  alen: {
    before:
      '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>Taxi Zagreb — Prijevoz 24&#x2F;7 | Zračna luka, gradske i noćne vožnje</title>\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n',
    tag: ALEN_TAG,
    after: '\n<script src="https://www.googletagmanager.com/gtag/js?id=AW-17804137574" async>',
    options:
      ' data-fp-agent="https://metrics.taxizagreb24.com/agent-m0zfpmtcwbpc"' +
      ' data-fp-endpoint="https://metrics.taxizagreb24.com/result-8ckw7w2h3ebt?region=eu"',
  },
}

/** A cs.js stand-in: the marker, and `$` sequences String#replace would read as patterns. */
const BODY = '"use strict";(()=>{var ke="data-cs-origin";var p="$&|$\'|$`|$$";})();\n'
const COPY = copyOf('live', BODY)

describe('inlineMode', () => {
  it('is on only for true, "true" and "on"', () => {
    for (const value of [true, 'true', 'on']) assert.equal(inlineMode(value), true, String(value))
    for (const value of [false, 'false', 'off', '0', 0, '', 'yes', 'TRUE', undefined, null]) {
      assert.equal(inlineMode(value), false, String(value))
    }
  })
})

describe('inlinable', () => {
  it('takes a cs.js that names data-cs-origin and holds nothing that ends a script', () => {
    assert.equal(inlinable(BODY), true)
  })

  it('refuses a copy without the marker, too big, or with text that ends or changes a script', () => {
    assert.equal(inlinable('"use strict";(()=>{})();'), false)
    assert.equal(inlinable(`${BODY}/*${'x'.repeat(MAX_COPY_BYTES)}*/`), false)
    for (const unsafe of ['</script>', '</SCRIPT', '<script', '<ScRiPt', '<!--']) {
      assert.equal(inlinable(`${BODY}/*${unsafe}*/`), false, unsafe)
    }
    assert.equal(inlinable(undefined), false)
    assert.equal(inlinable(Buffer.from(BODY)), false)
  })
})

describe('swapTag', () => {
  for (const [site, head] of Object.entries(HEADS)) {
    it(`replaces ${site}'s live tag in place, keeping its options and everything around it`, () => {
      const chunk = head.before + head.tag + head.after

      const swapped = swapTag(chunk, CS_JS_URL, COPY)

      assert.equal(
        swapped,
        head.before +
          `<script data-cs-origin="${ORIGIN}" data-cs-copy="${COPY.label}"${head.options}>` +
          BODY +
          '</script>' +
          head.after,
      )
      assert.equal(swapped.includes(`src="${CS_JS_URL}"`), false)
      assert.equal(swapped.includes('fetchpriority'), false)
      assert.equal(swapped.split('data-cs-origin=').length - 1, 1)
    })
  }

  it('inserts the body exactly as it is, $ sequences included', () => {
    const swapped = swapTag(TIM_TAG, CS_JS_URL, COPY)

    assert.equal(swapped.includes(BODY), true)
  })

  it('carries a CSP nonce and replaces only the first matching tag', () => {
    const tag = `<script src="${CS_JS_URL}" async nonce="r4nd0m" data-fp-agent="https://m.example/a"></script>`

    const swapped = swapTag(tag + tag, CS_JS_URL, COPY)

    assert.equal(
      swapped,
      `<script data-cs-origin="${ORIGIN}" data-cs-copy="${COPY.label}" nonce="r4nd0m"` +
        ` data-fp-agent="https://m.example/a">${BODY}</script>` +
        tag,
    )
  })

  it('leaves a head without the tag, or with a tag of a shape it does not know', () => {
    const shapes = [
      head(''),
      head(`<script src="https://cdn.example/cs.js" async></script>`),
      head(`<script src="${CS_JS_URL}" async data-x="a>b"></script>`),
      head(`<script src="${CS_JS_URL}" data-x='single'></script>`),
      head(`<script src="${CS_JS_URL}" async>/* not empty */</script>`),
      head(`<link rel="preload" src="${CS_JS_URL}">`),
    ]
    for (const chunk of shapes) assert.equal(swapTag(chunk, CS_JS_URL, COPY), null, chunk)
  })
})

describe('inlineHead', () => {
  it('swaps the first chunk that holds the tag and says so', () => {
    const chunks = ['<meta charset="utf-8">', TIM_TAG, TIM_TAG]

    assert.equal(inlineHead(chunks, CS_JS_URL, COPY), 'inlined')
    assert.equal(chunks[0], '<meta charset="utf-8">')
    assert.equal(chunks[1].startsWith('<script data-cs-origin='), true)
    assert.equal(chunks[2], TIM_TAG)
  })

  it('changes nothing without a copy or without the tag', () => {
    const chunks = [TIM_TAG]

    assert.equal(inlineHead(chunks, CS_JS_URL, null), 'no-copy')
    assert.equal(inlineHead(['<title>x</title>'], CS_JS_URL, COPY), 'no-tag')
    assert.deepEqual(chunks, [TIM_TAG])
  })
})

describe('landingKind', () => {
  const isAd = (query) => query.has('gclid') || query.has('gad_source')

  it('marks ad landings and install test links, nothing else', () => {
    assert.equal(landingKind('/?gclid=abc', isAd), 'ad')
    assert.equal(landingKind('/cijene?gad_source=1&gclid=abc', isAd), 'ad')
    assert.equal(landingKind('/?cs_test=signed.token', isAd), 'test')
    assert.equal(landingKind('/?cs_test=signed.token&gclid=abc', isAd), 'test')
    assert.equal(landingKind('/', isAd), null)
    assert.equal(landingKind('/?utm_source=google&utm_medium=organic', isAd), null)
    // An empty test token is no test link (cs.js reads it the same way).
    assert.equal(landingKind('/?cs_test=', isAd), null)
    // Error pages render under an internal address whose own query holds no ad parameter, built
    // by ufo, which leaves ? and = raw inside the url value and encodes &.
    assert.equal(landingKind('/__nuxt_error?url=%2Fnope%3Fgclid%3Dabc&statusCode=404', isAd), null)
    assert.equal(landingKind('/__nuxt_error?url=%2Fnope?gclid=abc&statusCode=404', isAd), null)
    assert.equal(
      landingKind('/__nuxt_error?url=%2Fnope?gad_source=1%26gclid=abc&statusCode=404', isAd),
      null,
    )
  })
})

describe('textOf', () => {
  it('reads a string, a Buffer and a Uint8Array, and nothing else', () => {
    assert.equal(textOf(BODY), BODY)
    assert.equal(textOf(Buffer.from(BODY)), BODY)
    assert.equal(textOf(new TextEncoder().encode(BODY)), BODY)
    assert.equal(textOf(undefined), '')
    assert.equal(textOf({ body: BODY }), '')
  })
})

describe('createCopyHolder', () => {
  const OTHER = BODY.replace('var p', 'var q')

  /** A body stream of `chunks` (strings), closed after the last one unless `stall` is set. */
  const streamOf = (chunks, { stall = false } = {}) =>
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk))
        if (!stall) controller.close()
      },
    })

  /** A holder on a fake clock and a fake fetch whose answers the test hands out one by one. */
  const setUp = ({ timeoutMs } = {}) => {
    const clock = { now: 0 }
    const calls = []
    const lines = []
    const fetch = (url, init) =>
      new Promise((resolve, reject) => {
        calls.push({ url, init, resolve, reject })
      })
    const holder = createCopyHolder({
      url: CS_JS_URL,
      fetch,
      now: () => clock.now,
      log: (severity, message, fields) => lines.push({ severity, message, fields }),
      userAgent: 'clickshield-inline/test',
      timeoutMs,
    })
    const settle = () => new Promise((resolve) => setImmediate(resolve))
    /** Answers the newest fetch: a 200 JavaScript body, { status, type, body, stream }, or an error. */
    const answer = async (reply) => {
      const call = calls.at(-1)
      if (reply instanceof Error) call.reject(reply)
      else {
        const { status = 200, type = 'text/javascript; charset=utf-8', body = '', stream } =
          typeof reply === 'string' ? { body: reply } : reply
        call.resolve({
          status,
          headers: { get: (name) => (name === 'content-type' ? type : null) },
          body: stream ?? streamOf([body]),
        })
      }
      await settle()
    }
    return { clock, calls, lines, holder, answer, settle, streamOf }
  }

  it('fetches at once, one refresh at a time, then again only once the copy is 5 minutes old', async () => {
    const { clock, calls, holder, answer } = setUp()

    holder.refreshIfDue()
    holder.refreshIfDue()
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, CS_JS_URL)
    assert.equal(calls[0].init.redirect, 'error')
    assert.equal(calls[0].init.headers['user-agent'], 'clickshield-inline/test')
    assert.equal(calls[0].init.signal instanceof AbortSignal, true)

    await answer(BODY)
    assert.equal(holder.current().label, COPY.label)

    clock.now = FRESH_MS - 1
    holder.refreshIfDue()
    assert.equal(calls.length, 1)
    clock.now = FRESH_MS
    holder.refreshIfDue()
    assert.equal(calls.length, 2)
  })

  it('takes every new inlinable answer, and reports how old the copy is', async () => {
    const { clock, holder, answer, lines } = setUp()

    holder.refreshIfDue()
    await answer(BODY)
    clock.now = FRESH_MS
    holder.refreshIfDue()
    await answer(OTHER)
    clock.now = FRESH_MS + 42_000

    assert.equal(holder.current().label, copyOf('live', OTHER).label)
    assert.equal(holder.current().ageS, 42)
    assert.deepEqual(
      lines.filter((line) => line.message === 'copy updated').map((line) => line.fields.to),
      [COPY.label, copyOf('live', OTHER).label],
    )
  })

  it('drops the copy, with one warning, when ClickShield serves a cs.js that cannot run inline', async () => {
    const { clock, holder, answer, lines } = setUp()
    holder.refreshIfDue()
    await answer(BODY)

    clock.now = FRESH_MS
    holder.refreshIfDue()
    await answer('"use strict";(()=>{})();')
    clock.now = 2 * FRESH_MS
    holder.refreshIfDue()
    await answer('"use strict";(()=>{})();')

    assert.equal(holder.current(), null)
    assert.equal(lines.filter((line) => line.severity === 'WARNING').length, 1)
  })

  it('keeps the copy it holds when ClickShield gives no answer', async () => {
    const replies = [
      new TypeError('fetch failed'),
      new DOMException('The operation was aborted due to timeout', 'TimeoutError'),
      new TypeError('fetch failed: redirect mode is set to error'),
      { status: 503, type: 'text/html' },
      { status: 404, type: 'text/html' },
      { status: 200, type: 'text/html', body: '<html>portal</html>' },
    ]
    for (const reply of replies) {
      const { clock, holder, answer } = setUp()
      holder.refreshIfDue()
      await answer(BODY)

      clock.now = FRESH_MS
      holder.refreshIfDue()
      await answer(reply)

      assert.equal(holder.current()?.label, COPY.label, String(reply.message ?? reply.status))
    }
  })

  it('retries after 30 s, doubling to every 5 minutes, and starts over after an answer', async () => {
    const { clock, calls, holder, answer } = setUp()
    const gaps = []
    holder.refreshIfDue()
    for (let tries = 0; tries < 6; tries++) {
      await answer(new TypeError('fetch failed'))
      const failedAt = clock.now
      const before = calls.length
      while (calls.length === before) {
        clock.now += 1_000
        holder.refreshIfDue()
      }
      gaps.push(clock.now - failedAt)
    }
    assert.deepEqual(gaps, [...RETRY_MS, 300_000])

    await answer(BODY)
    clock.now += FRESH_MS
    holder.refreshIfDue()
    await answer(new TypeError('fetch failed'))
    const failedAt = clock.now
    const before = calls.length
    while (calls.length === before) {
      clock.now += 1_000
      holder.refreshIfDue()
    }
    assert.equal(clock.now - failedAt, RETRY_MS[0])
  })

  it('serves the bundled fallback only once ClickShield has failed to answer since boot', async () => {
    const { clock, holder, answer } = setUp()
    holder.setFallback(OTHER)
    const fallback = copyOf('fallback', OTHER).label

    holder.refreshIfDue()
    assert.equal(holder.current(), null, 'not while the first fetch is out')

    await answer(new TypeError('fetch failed'))
    assert.equal(holder.current().label, fallback)
    assert.equal(holder.current().ageS, null)

    clock.now = RETRY_MS[0]
    holder.refreshIfDue()
    await answer(BODY)
    assert.equal(holder.current().label, COPY.label, 'a live copy takes over')
  })

  it('lets a page wait for the first answer since boot: the live copy, or the stop', async () => {
    for (const [reply, expected] of [
      [BODY, COPY.label],
      ['"use strict";(()=>{})();', null],
    ]) {
      const { holder, answer, settle } = setUp()
      holder.setFallback(OTHER)
      holder.refreshIfDue()
      let done = false
      const waiting = holder.firstAnswer(5_000).then(() => {
        done = true
      })
      await settle()
      assert.equal(done, false, 'the first fetch is out')

      await answer(reply)
      await waiting
      assert.equal(holder.current()?.label ?? null, expected)
    }
  })

  it('waits for the first answer at most the given time, then no page waits again', async () => {
    const { holder, answer, settle } = setUp()
    holder.setFallback(OTHER)
    holder.refreshIfDue()
    const startedAt = Date.now()

    await holder.firstAnswer(30)

    assert.equal(Date.now() - startedAt >= 25, true)
    assert.equal(holder.current(), null, 'no answer and no failure yet: not the fallback')
    let done = false
    holder.firstAnswer(5_000).then(() => {
      done = true
    })
    await settle()
    assert.equal(done, true, 'the first try is still out, but one page has waited for it')
    await answer(BODY)
    assert.equal(holder.current().label, COPY.label)
  })

  it('never waits for a later try: after an answer, after a failure, or with no try out', async () => {
    const resolvesAtOnce = async (holder, settle) => {
      let done = false
      holder.firstAnswer(5_000).then(() => {
        done = true
      })
      await settle()
      return done
    }
    const fresh = setUp()
    assert.equal(await resolvesAtOnce(fresh.holder, fresh.settle), true, 'no try started')

    const answered = setUp()
    answered.holder.refreshIfDue()
    await answered.answer(BODY)
    answered.clock.now = FRESH_MS
    answered.holder.refreshIfDue()
    assert.equal(await resolvesAtOnce(answered.holder, answered.settle), true, 'a refresh is out')

    const failed = setUp()
    failed.holder.setFallback(OTHER)
    failed.holder.refreshIfDue()
    await failed.answer(new TypeError('fetch failed'))
    failed.clock.now = RETRY_MS[0]
    failed.holder.refreshIfDue()
    assert.equal(await resolvesAtOnce(failed.holder, failed.settle), true, 'a retry is out')
    assert.equal(failed.holder.current().label, copyOf('fallback', OTHER).label)
  })

  it('never serves the fallback after a final answer, even one that drops the copy', async () => {
    const { clock, holder, answer } = setUp()
    holder.setFallback(OTHER)

    holder.refreshIfDue()
    await answer('"use strict";(()=>{})();')
    clock.now = FRESH_MS
    holder.refreshIfDue()
    await answer(new TypeError('fetch failed'))

    assert.equal(holder.current(), null)
  })

  it('gives up on a body that stops arriving, keeps its copy, and retries after 30 s', async () => {
    const { clock, calls, holder, answer, lines, settle } = setUp({ timeoutMs: 40 })
    holder.refreshIfDue()
    await answer(BODY)

    clock.now = FRESH_MS
    holder.refreshIfDue()
    await answer({ stream: streamOf([BODY.slice(0, 20)], { stall: true }) })
    await new Promise((resolve) => setTimeout(resolve, 120))
    await settle()

    assert.equal(holder.current().label, COPY.label)
    const failed = lines.filter((line) => line.message === 'cs.js not refreshed')
    assert.equal(failed.length, 1)
    assert.equal(failed[0].severity, 'INFO', 'a live copy is held')
    const before = calls.length
    clock.now = FRESH_MS + RETRY_MS[0] - 1
    holder.refreshIfDue()
    assert.equal(calls.length, before)
    clock.now = FRESH_MS + RETRY_MS[0]
    holder.refreshIfDue()
    assert.equal(calls.length, before + 1)
  })

  it('reads no further than 32 KiB, and takes a bigger body as one that cannot run inline', async () => {
    const { holder, answer, lines } = setUp()
    holder.refreshIfDue()
    const half = `/*${'x'.repeat(MAX_COPY_BYTES / 2)}*/`
    await answer({ stream: streamOf([BODY, half, half, half]) })

    assert.equal(holder.current(), null)
    const warning = lines.find((line) => line.severity === 'WARNING')
    assert.equal(warning.message.includes('cannot run inline'), true)
    assert.equal(warning.fields.bytes, `over ${MAX_COPY_BYTES}`)
  })

  it('warns once when ad landings start getting the bundled fallback', async () => {
    const { holder, answer, lines } = setUp()
    holder.setFallback(OTHER)
    holder.refreshIfDue()
    await answer(new TypeError('fetch failed', { cause: new Error('unexpected redirect') }))

    holder.current()
    holder.current()

    const failed = lines.find((line) => line.message === 'cs.js not refreshed')
    assert.equal(failed.severity, 'WARNING', 'no live copy is held')
    assert.equal(failed.fields.cause, 'Error: unexpected redirect')
    const served = lines.filter((line) => line.message.startsWith('ad landings get the bundled fallback'))
    assert.equal(served.length, 1)
    assert.equal(served[0].severity, 'WARNING')
  })

  it('ignores a fallback that cannot run inline, with a warning', () => {
    const { holder, lines } = setUp()

    holder.setFallback('"use strict";(()=>{})();')

    assert.equal(lines.at(-1).severity, 'WARNING')
  })

  it('warns once per 6 hours while it serves a copy no refresh has confirmed', async () => {
    const { clock, holder, answer, lines } = setUp()
    holder.refreshIfDue()
    await answer(BODY)
    const stale = () => lines.filter((line) => line.message.startsWith('no successful cs.js refresh'))

    for (let at = FRESH_MS; at <= 2 * STALE_WARN_MS + FRESH_MS; at += FRESH_MS) {
      clock.now = at
      holder.refreshIfDue()
      await answer(new TypeError('fetch failed'))
    }

    assert.equal(stale().length, 2)
    assert.equal(stale()[0].severity, 'WARNING')
    assert.equal(holder.current().label, COPY.label)
  })
})

describe('the bundled fallback', () => {
  it('is a cs.js that can run inline', () => {
    const text = readFileSync(new URL('../assets/clickshield/cs-fallback.txt', import.meta.url), 'utf8')

    assert.equal(inlinable(text), true)
  })
})

/** A head chunk around `tag`. */
function head(tag) {
  return `<meta charset="utf-8">\n<title>x</title>\n${tag}\n<style>`
}
