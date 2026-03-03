const TRACKER_URL = 'https://us-central1-angular-scaffold.cloudfunctions.net/serveTracker/t/67508e94-dd1.js'

let cachedScript: string | null = null

async function fetchTrackerScript(): Promise<string> {
  if (cachedScript) return cachedScript

  try {
    const response = await fetch(TRACKER_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    cachedScript = await response.text()
    console.log('[inline-tracker] Script fetched and cached')
  } catch (e) {
    console.warn('[inline-tracker] Failed to fetch script:', e)
    cachedScript = ''
  }

  return cachedScript
}

export default defineNitroPlugin((nitroApp) => {
  fetchTrackerScript()

  nitroApp.hooks.hook('render:html', async (html) => {
    const script = await fetchTrackerScript()
    if (script) {
      html.head.push(`<script>${script}</script>`)
    }
  })
})
