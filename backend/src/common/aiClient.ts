import { logger } from './logger'

// -------- concurrency gate --------
// Upstream AI APIs rate-limit aggressively; without a gate a burst of
// incoming requests fires a matching burst of fetches and everything 429s
// at once. A small semaphore smooths that out.
class Semaphore {
  private active = 0
  private queue: Array<() => void> = []
  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++
      return
    }
    await new Promise<void>((resolve) => this.queue.push(resolve))
    this.active++
  }

  release(): void {
    this.active--
    const next = this.queue.shift()
    if (next) next()
  }
}

const concurrency = parseInt(process.env.AI_MAX_CONCURRENCY || '5', 10)
const gate = new Semaphore(concurrency > 0 ? concurrency : 5)

// -------- retry policy --------
const DEFAULT_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10)
const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.AI_MAX_ATTEMPTS || '3', 10))
const BASE_BACKOFF_MS = 500

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export interface AIFetchResult {
  ok: boolean
  status: number
  body: string
}

export async function aiFetch(
  url: string,
  init: {
    headers?: Record<string, string>
    body: string
    timeoutMs?: number
    attempts?: number
  }
): Promise<AIFetchResult> {
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxAttempts = init.attempts ?? MAX_ATTEMPTS

  await gate.acquire()
  try {
    let lastError: unknown = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), timeoutMs)
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
          body: init.body,
          signal: ac.signal,
        })
        const text = await res.text()
        if (res.ok) return { ok: true, status: res.status, body: text }

        if (!isTransientStatus(res.status) || attempt === maxAttempts) {
          return { ok: false, status: res.status, body: text }
        }
        logger.warn(
          { status: res.status, attempt, url },
          'ai transient error, retrying'
        )
      } catch (err) {
        lastError = err
        if (attempt === maxAttempts) {
          return {
            ok: false,
            status: 0,
            body: err instanceof Error ? err.message : String(err),
          }
        }
        logger.warn({ err, attempt, url }, 'ai fetch failed, retrying')
      } finally {
        clearTimeout(timer)
      }

      // Exponential backoff with decorrelated jitter, capped at 8s.
      const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), 8000)
      const jittered = backoff / 2 + Math.random() * (backoff / 2)
      await sleep(jittered)
    }
    return {
      ok: false,
      status: 0,
      body: lastError instanceof Error ? lastError.message : 'exhausted retries',
    }
  } finally {
    gate.release()
  }
}
