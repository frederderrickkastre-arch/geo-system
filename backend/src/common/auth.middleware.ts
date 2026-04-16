import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from './config'

export interface AuthRequest extends Request {
  userId?: number
  username?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未登录或登录已过期' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any
    req.userId = decoded.userId
    req.username = decoded.username
    next()
  } catch {
    return res.status(401).json({ code: 401, msg: 'Token无效或已过期' })
  }
}
