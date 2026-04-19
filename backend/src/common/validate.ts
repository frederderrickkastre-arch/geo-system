import type { RequestHandler } from 'express'
import type { ZodTypeAny } from 'zod'

// Express middleware that validates req.body (or query) against a zod
// schema and replaces the original payload with the parsed value so
// downstream handlers see the coerced, typed data. Invalid input returns
// a 400 with a compact field-level error list instead of a stack trace.
export function validateBody<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        code: 400,
        msg: '参数校验失败',
        data: {
          errors: parsed.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      })
    }
    req.body = parsed.data
    next()
  }
}

export function validateQuery<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({
        code: 400,
        msg: '参数校验失败',
        data: {
          errors: parsed.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      })
    }
    // Express marks req.query readonly in modern @types, so replace via
    // Object.defineProperty rather than direct assignment.
    Object.defineProperty(req, 'query', { value: parsed.data, writable: true })
    next()
  }
}

// Re-export zod so router files only need to import from one place.
export { z } from 'zod'
