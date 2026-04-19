import type { NextFunction, Request, RequestHandler, Response } from 'express'

// Wrap an async route so unhandled rejections flow into the central
// error middleware instead of crashing the process or hanging the request.
export function asyncHandler<R extends Request = Request>(
  fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as R, res, next)).catch(next)
  }
}
