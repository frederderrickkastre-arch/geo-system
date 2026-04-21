import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'
import { testAIConnection } from '../../common/ai.service'

export const adminRouter = Router()

// AI 连通性自检（读取当前 .env 配置，向中转站 / 厂商发一条最小请求）
adminRouter.post('/ai/test', async (_req: AuthRequest, res) => {
  try {
    const result = await testAIConnection()
    res.json(success(result))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// 实名认证审核列表
adminRouter.get('/verifications', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = (req.query.status as string) || ''

    let where = '1=1'
    const params: any[] = []
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }

    const result = await paginate<any>('verification_requests', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// 审核：通过
adminRouter.post('/verifications/:id/approve', async (req: AuthRequest, res) => {
  try {
    const row = await queryOne<any>('SELECT user_id, real_name FROM verification_requests WHERE id = ?', [req.params.id])
    if (!row) return res.json(error('记录不存在'))
    await execute("UPDATE verification_requests SET status = 'approved', reject_reason = '', reviewed_at = NOW() WHERE id = ?", [req.params.id])
    await execute('UPDATE users SET verified = 1, real_name = ? WHERE id = ?', [row.real_name, row.user_id])
    res.json(success(null, '已通过'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// 审核：驳回
adminRouter.post('/verifications/:id/reject', async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body
    const row = await queryOne<any>('SELECT user_id FROM verification_requests WHERE id = ?', [req.params.id])
    if (!row) return res.json(error('记录不存在'))
    await execute(
      "UPDATE verification_requests SET status = 'rejected', reject_reason = ?, reviewed_at = NOW() WHERE id = ?",
      [reason || '资料不完整', req.params.id]
    )
    await execute('UPDATE users SET verified = 0 WHERE id = ?', [row.user_id])
    res.json(success(null, '已驳回'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// 平台概览
adminRouter.get('/stats', async (_req: AuthRequest, res) => {
  try {
    const [userCount, verifiedCount, pendingVerify, articleCount, submissionCount, publishTaskCount] = await Promise.all([
      queryOne<any>('SELECT COUNT(*) as cnt FROM users'),
      queryOne<any>('SELECT COUNT(*) as cnt FROM users WHERE verified = 1'),
      queryOne<any>("SELECT COUNT(*) as cnt FROM verification_requests WHERE status = 'pending'"),
      queryOne<any>('SELECT COUNT(*) as cnt FROM articles'),
      queryOne<any>('SELECT COUNT(*) as cnt FROM submissions'),
      queryOne<any>('SELECT COUNT(*) as cnt FROM publish_tasks'),
    ])
    res.json(success({
      users: userCount?.cnt || 0,
      verifiedUsers: verifiedCount?.cnt || 0,
      pendingVerifications: pendingVerify?.cnt || 0,
      articles: articleCount?.cnt || 0,
      submissions: submissionCount?.cnt || 0,
      publishTasks: publishTaskCount?.cnt || 0,
    }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
