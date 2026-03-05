const TRACKER_URL = 'https://us-central1-angular-scaffold.cloudfunctions.net/serveTracker/t/67508e94-dd1.js'

async function fetchTrackerScript(): Promise<string> {
  try {
    const response = await fetch(TRACKER_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } catch (e) {
    console.warn('[inline-tracker] Failed to fetch script:', e)
    return ''
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', async (html) => {
    const script = await fetchTrackerScript()
    if (script) {
      html.head.push(`<script>${script}</script>`)
    }
  })
})
