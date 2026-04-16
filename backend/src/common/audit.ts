import type { Request } from 'express'
import { execute } from './db'

export type AuditAction =
  | 'login.success'
  | 'login.fail'
  | 'login.blocked'
  | 'register.success'
  | 'register.fail'
  | 'logout'

export interface AuditEntry {
  userId?: number | null
  username?: string | null
  action: AuditAction
  detail?: string
  ip?: string | null
  userAgent?: string | null
}

function clientIp(req?: Request): string | null {
  if (!req) return null
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return req.ip || req.socket?.remoteAddress || null
}

export async function recordAudit(entry: AuditEntry, req?: Request): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (user_id, username, action, detail, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.userId ?? null,
        entry.username ?? null,
        entry.action,
        entry.detail ?? null,
        entry.ip ?? clientIp(req),
        entry.userAgent ?? (req?.headers['user-agent'] as string | undefined) ?? null,
      ]
    )
  } catch (err) {
    // Audit must never break the request path.
    // eslint-disable-next-line no-console
    console.warn('[audit] failed to record', entry.action, (err as Error).message)
  }
}
