import { neonConfig } from '@neondatabase/serverless'

/**
 * Neon's HTTP endpoint occasionally drops a fresh connection with a bare
 * `TypeError: fetch failed` and no response (see lib/db/network.ts for the
 * network flakiness this environment has). Drizzle can't tell that apart
 * from a real outage and throws straight through to the page. Retry only
 * that case — a real query error still comes back as a Response and never
 * reaches this catch.
 */
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 200

async function fetchWithRetry(url: string | URL | Request, init?: RequestInit) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, init)
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS || !(err instanceof TypeError)) throw err
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
    }
  }
}

neonConfig.fetchFunction = fetchWithRetry
