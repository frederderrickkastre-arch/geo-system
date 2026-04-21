import type { Request, Response, NextFunction } from 'express'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-'
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ${ip}`)
  })
  next()
}
