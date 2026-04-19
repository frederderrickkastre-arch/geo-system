import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from './config'

export type UserRole = 'admin' | 'user'

export interface AuthRequest extends Request {
  userId?: number
  username?: string
  userRole?: UserRole
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
    // Default to 'user' for tokens minted before the role claim existed,
    // so older sessions keep working until they expire naturally.
    req.userRole = decoded.role === 'admin' ? 'admin' : 'user'
    next()
  } catch {
    return res.status(401).json({ code: 401, msg: 'Token无效或已过期' })
  }
}

export function requireRole(role: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.userRole !== role) {
      return res.status(403).json({ code: 403, msg: '权限不足', data: null })
    }
    next()
  }
}
