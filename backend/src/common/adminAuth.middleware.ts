import type { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'
import { queryOne } from './db'
import { error } from './response'

export async function adminAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await queryOne<any>('SELECT role FROM users WHERE id = ?', [req.userId])
    if (!user || user.role !== 'admin') {
      return res.status(403).json(error('无权访问', 403))
    }
    next()
  } catch (e: any) {
    res.status(500).json(error(e.message))
  }
}
