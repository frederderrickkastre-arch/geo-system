import Redis from 'ioredis'
import { config } from './config'

let client: Redis | null = null
let connectionFailedAt = 0
const RECONNECT_BACKOFF_MS = 30_000

function getClient(): Redis | null {
  if (!config.redis.enabled) return null
  if (client) return client
  if (Date.now() - connectionFailedAt < RECONNECT_BACKOFF_MS) return null

  try {
    client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: false,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
    client.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.warn('[cache] redis error:', err.message)
      connectionFailedAt = Date.now()
    })
    return client
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cache] redis init failed:', (err as Error).message)
    connectionFailedAt = Date.now()
    client = null
    return null
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const c = getClient()
  if (!c) return null
  try {
    const raw = await c.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const c = getClient()
  if (!c) return
  try {
    await c.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // swallow — cache must never break the request path
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const c = getClient()
  if (!c || keys.length === 0) return
  try {
    await c.del(...keys)
  } catch {
    /* ignore */
  }
}

// Read-through helper: returns the cached value or computes, stores, and returns it.
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key)
  if (hit !== null) return hit
  const value = await loader()
  if (value !== undefined && value !== null) {
    await cacheSet(key, value, ttlSeconds)
  }
  return value
}

export async function cachePing(): Promise<boolean> {
  const c = getClient()
  if (!c) return false
  try {
    const r = await c.ping()
    return r === 'PONG'
  } catch {
    return false
  }
}

export async function closeCache(): Promise<void> {
  if (!client) return
  const c = client
  client = null
  try {
    await c.quit()
  } catch {
    c.disconnect()
  }
}
