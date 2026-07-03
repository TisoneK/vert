/**
 * Fetch with automatic retry on 500 errors.
 *
 * Serverless functions (Vercel) cold-start when idle. The first request
 * after idle can timeout and return 500. This wrapper retries once
 * after a short delay, making cold-start 500s invisible to users.
 *
 * Usage: same as fetch(), but with automatic retry.
 *   const res = await fetchWithRetry('/api/v1/trending')
 *   const data = await res.json()
 */

export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  options?: { retries?: number; delay?: number }
): Promise<Response> {
  const retries = options?.retries ?? 1
  const delay = options?.delay ?? 1000

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init)

      // Retry on 500 (server error / cold start) but not on 4xx (client error)
      if (res.status >= 500 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      return res
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}
