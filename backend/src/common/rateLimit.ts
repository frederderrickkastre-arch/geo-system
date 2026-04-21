import type { Request, Response, NextFunction } from 'express'

interface Bucket {
  count: number
  resetAt: number
}

/**
 * 简单的内存滑动窗口限流。多副本部署请换成 Redis 版本。
 */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const store = new Map<string, Bucket>()
  const { windowMs, max } = options
  const message = options.message || '请求过于频繁，请稍后再试'

  // 周期性清理
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k)
    }
  }, Math.max(windowMs, 60_000)).unref?.()

  return (req: Request, res: Response, next: NextFunction) => {
    const key = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    const now = Date.now()
    const bucket = store.get(key)
    if (!bucket || bucket.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    bucket.count += 1
    if (bucket.count > max) {
      res.status(429).json({ code: 429, msg: message, data: null })
      return
    }
    next()
  }
}
