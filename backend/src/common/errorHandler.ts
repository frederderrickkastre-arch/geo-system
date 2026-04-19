import type { ErrorRequestHandler, RequestHandler } from 'express'
import { config } from './config'

export class HttpError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message)
    this.name = 'HttpError'
  }
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ code: 404, msg: `Not Found: ${req.method} ${req.path}`, data: null })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status : err?.status || 500
  const msg = err?.message || '服务器内部错误'

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err)
  }

  res.status(status).json({
    code: status,
    msg,
    data: null,
    ...(config.isProduction ? {} : { stack: err?.stack }),
  })
}
