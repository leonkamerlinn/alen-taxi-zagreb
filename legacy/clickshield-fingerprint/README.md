# Parked: the site's own ClickShield integration

These two Nuxt plugins tracked ad clicks for ClickShield until 2026-10-17, when the site moved to
ClickShield's hosted script (see "Tracking: ClickShield's hosted script" in the root README).
They sit outside `plugins/`, so Nuxt no longer registers them; the helpers they import
(`utils/fingerprint-early-script.ts`, `utils/fingerprint-ingest.ts`,
`composables/usePageContext.ts`) and the runtime config keys stay where they were.

To roll back: move both files back into `plugins/`, remove the `cs.js` entry from
`app.head.script` in `nuxt.config.ts`, and push `main`.
