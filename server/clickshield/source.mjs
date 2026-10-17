/**
 * Where ClickShield serves its tracker, cs.js. nuxt.config.ts renders it as the page's
 * `<script src>`, and server/plugins/clickshield-inline.ts matches that same tag and fetches its
 * inline copy from it: one constant, so the two never drift (server code may not import
 * nuxt.config). The same file in tim-taxi-zagreb and alen-taxi-zagreb.
 */
export const CS_JS_URL = 'https://clickshield-web-370434332956.europe-west4.run.app/cs.js'
