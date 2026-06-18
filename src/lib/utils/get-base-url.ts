import { getSettings } from '../api/settings'

const FALLBACK_URL = 'https://liveflow-1on.pages.dev'

/**
 * Returns the site base URL to use when building links sent to customers.
 * Priority: settings.site_url → FALLBACK_URL
 */
export async function getBaseUrl(): Promise<string> {
  try {
    const settings = await getSettings()
    if (settings.site_url && settings.site_url.trim()) {
      // Strip trailing slash
      return settings.site_url.trim().replace(/\/$/, '')
    }
  } catch {
    // ignore – use fallback
  }
  return FALLBACK_URL
}
