import { Router } from 'express'
import { paginated, error, success } from '../../common/response'
import { paginate, query } from '../../common/db'
import { validateQuery, z } from '../../common/validate'

export const adminRouter = Router()

// Audit log browser. Supports filter by action / username / IP / time
// range so an on-call admin can answer "what did this account do in the
// last hour?" without SSHing into the DB.
const auditQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().max(64).optional(),
  username: z.string().max(64).optional(),
  ip: z.string().max(64).optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
})

adminRouter.get('/audit-logs', validateQuery(auditQuerySchema), async (req, res) => {
  try {
    const { page, pageSize, action, username, ip, since, until } = req.query as any

    const clauses: string[] = ['1 = 1']
    const params: any[] = []
    if (action) {
      clauses.push('action = ?')
      params.push(action)
    }
    if (username) {
      clauses.push('username = ?')
      params.push(username)
    }
    if (ip) {
      clauses.push('ip = ?')
      params.push(ip)
    }
    if (since) {
      clauses.push('created_at >= ?')
      params.push(since)
    }
    if (until) {
      clauses.push('created_at <= ?')
      params.push(until)
    }

    const result = await paginate(
      'audit_logs',
      clauses.join(' AND '),
      params,
      page,
      pageSize,
      'id DESC'
    )
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// Aggregate view: failure counts per action over the last 24h. Lets the
// monitoring/on-call see spikes without paging through rows.
adminRouter.get('/audit-logs/summary', async (_req, res) => {
  try {
    const rows = await query<{ action: string; cnt: number }>(
      `SELECT action, COUNT(*) as cnt
         FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL 1 DAY
        GROUP BY action
        ORDER BY cnt DESC`
    )
    res.json(success({ window: '24h', counts: rows }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
