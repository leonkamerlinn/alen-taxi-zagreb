/**
 * ClickShield's tracker inline on ad landings and install test links. The logic and its reasons
 * live in server/clickshield/inline.mjs (tested by inline.test.mjs); this is the Nitro glue. The
 * same file in tim-taxi-zagreb and alen-taxi-zagreb.
 *
 * - Every page keeps the `<script src=".../cs.js">` from nuxt.config.ts by default. On an ad
 *   landing, `render:html` swaps that tag IN PLACE for the copy this instance holds, so the copy
 *   runs where the tag was: after charset and title, before every stylesheet.
 * - Rendering only reads memory, so no page ever waits on ClickShield. The copy refreshes in the
 *   background: at boot, then at the start of the first request after it is due (Cloud Run gives
 *   an instance CPU only while it serves a request).
 * - Everything is inside try/catch: a throw at plugin init would stop the server from booting, and
 *   a throw in render:html would answer the page with a 500. Any miss leaves the src tag.
 * - WARNING: never cache the HTML of these pages (routeRules swr/isr/cache, a CDN). A cached ad
 *   landing would hand one instance's copy, however old, to every visitor.
 * - Off switch: NUXT_CLICKSHIELD_INLINE=false on the Cloud Run service. It survives deploys
 *   (deploy.yml uses --update-env-vars); remove it with --remove-env-vars.
 */
import { detectAdTraffic } from '~/composables/usePageContext'
import {
  createCopyHolder,
  inlineHead,
  inlineMode,
  landingKind,
  logLine,
  textOf,
} from '../clickshield/inline.mjs'
import { CS_JS_URL } from '../clickshield/source.mjs'

/** server/assets/clickshield/cs-fallback.txt, as the server assets storage names it. */
const FALLBACK_KEY = 'clickshield:cs-fallback.txt'

export default defineNitroPlugin((nitroApp) => {
  try {
    const setting: unknown = useRuntimeConfig().clickshield?.inline
    const on = inlineMode(setting)
    // A local run (no K_SERVICE) may fetch its copy elsewhere: a dead port or an old cs.js.
    const copyUrl = process.env.K_SERVICE ? CS_JS_URL : process.env.CLICKSHIELD_COPY_URL || CS_JS_URL
    logLine('INFO', `inline copy ${on ? 'on' : 'off'}`, { setting: String(setting), copyUrl })

    const holder = on
      ? createCopyHolder({
          url: copyUrl,
          fetch: (url, init) => fetch(url, init),
          now: Date.now,
          log: logLine,
          userAgent: `clickshield-inline/${process.env.K_SERVICE ?? 'local'}`,
        })
      : null
    if (holder) {
      holder.refreshIfDue()
      useStorage('assets:server')
        .getItemRaw(FALLBACK_KEY)
        .then(
          (raw) => holder.setFallback(textOf(raw)),
          (error) => logLine('WARNING', 'no bundled fallback', { error: String(error) }),
        )
      // Returns nothing: Nitro awaits request hooks, and no request may wait for a refresh.
      nitroApp.hooks.hook('request', () => {
        holder.refreshIfDue()
      })
    }

    nitroApp.hooks.hook('render:html', (html, { event }) => {
      try {
        const kind = landingKind(event.path, (query) => detectAdTraffic(query).isAd)
        if (!kind) return
        const copy = holder ? holder.current() : null
        const reason = holder ? inlineHead(html.head, CS_JS_URL, copy) : 'off'
        logLine('INFO', kind === 'test' ? 'install test' : 'ad landing', {
          mode: reason === 'inlined' ? 'inline' : 'src',
          reason,
          copy: reason === 'inlined' && copy ? copy.label : null,
          ageS: reason === 'inlined' && copy ? copy.ageS : null,
          dest: getRequestHeader(event, 'sec-fetch-dest') ?? null,
          purpose: getRequestHeader(event, 'sec-purpose') ?? null,
        })
      } catch (error) {
        logLine('WARNING', 'a page kept the cs.js src tag after an error', { error: String(error) })
      }
    })
  } catch (error) {
    console.warn(`[clickshield] inline copy off: ${String(error)}`)
  }
})
