import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { aiFetch } from './aiClient'

describe('aiFetch', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.useRealTimers()
  })

  it('returns ok=true on 2xx', async () => {
    globalThis.fetch = vi.fn(async () => new Response('{"ok":1}', { status: 200 })) as any
    const p = aiFetch('http://x', { body: '{}' })
    await vi.runAllTimersAsync()
    const r = await p
    expect(r).toMatchObject({ ok: true, status: 200 })
    expect(r.body).toBe('{"ok":1}')
  })

  it('retries on 503 and succeeds on the second attempt', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce(new Response('boom', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
    globalThis.fetch = fn as any
    const p = aiFetch('http://x', { body: '{}' })
    await vi.runAllTimersAsync()
    const r = await p
    expect(fn).toHaveBeenCalledTimes(2)
    expect(r).toMatchObject({ ok: true, status: 200, body: 'ok' })
  })

  it('does NOT retry on 4xx other than 408/425/429', async () => {
    const fn = vi.fn().mockResolvedValue(new Response('bad', { status: 400 }))
    globalThis.fetch = fn as any
    const p = aiFetch('http://x', { body: '{}' })
    await vi.runAllTimersAsync()
    const r = await p
    expect(fn).toHaveBeenCalledTimes(1)
    expect(r).toMatchObject({ ok: false, status: 400 })
  })

  it('retries on 429 and gives up after maxAttempts', async () => {
    const fn = vi.fn().mockResolvedValue(new Response('too many', { status: 429 }))
    globalThis.fetch = fn as any
    const p = aiFetch('http://x', { body: '{}', attempts: 3 })
    await vi.runAllTimersAsync()
    const r = await p
    expect(fn).toHaveBeenCalledTimes(3)
    expect(r).toMatchObject({ ok: false, status: 429 })
  })

  it('times out via AbortController', async () => {
    globalThis.fetch = vi.fn(
      (_url: any, init: any) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')))
        })
    ) as any
    const p = aiFetch('http://x', { body: '{}', timeoutMs: 100, attempts: 1 })
    await vi.advanceTimersByTimeAsync(150)
    const r = await p
    expect(r.ok).toBe(false)
    expect(r.status).toBe(0)
  })
})
