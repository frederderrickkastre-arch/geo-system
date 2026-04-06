import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const userRouter = Router()

userRouter.get('/profile', async (req: AuthRequest, res) => {
  try {
    const user = await queryOne<any>(
      'SELECT id, username, nickname, avatar, phone, email, vip_expiry, balance, points, verified, real_name FROM users WHERE id = ?',
      [req.userId]
    )
    if (!user) return res.json(error('用户不存在'))
    res.json(success({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      vipExpiry: user.vip_expiry || '',
      balance: parseFloat(user.balance) || 0,
      points: user.points || 0,
      phone: user.phone,
      email: user.email,
      verified: user.verified,
      realName: user.real_name,
    }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.get('/benefits', async (req: AuthRequest, res) => {
  try {
    const user = await queryOne<any>(
      'SELECT vip_expiry, balance, points FROM users WHERE id = ?',
      [req.userId]
    )
    const quotas = await queryOne<any>(
      'SELECT * FROM user_quotas WHERE user_id = ?',
      [req.userId]
    )

    const kwCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM keywords WHERE user_id = ?', [req.userId])
    const qCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM questions WHERE user_id = ?', [req.userId])
    const aiCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM ai_tasks WHERE user_id = ?', [req.userId])
    const pubCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM submissions WHERE user_id = ?', [req.userId])
    const maCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM user_media_accounts WHERE user_id = ?', [req.userId])

    const indexedCount = await queryOne<any>(
      'SELECT COUNT(DISTINCT keyword) as cnt FROM platform_indexing WHERE user_id = ? AND indexed = 1',
      [req.userId]
    )

    const PLATFORMS = ['DeepSeek', '豆包', '腾讯元宝', '通义千问', '文心一言', '纳米', 'KIMI', '智谱']
    const aiModels = []
    for (const name of PLATFORMS) {
      const row = await queryOne<any>(
        'SELECT COUNT(*) as cnt FROM platform_indexing WHERE user_id = ? AND platform = ? AND indexed = 1',
        [req.userId, name]
      )
      aiModels.push({ name, count: row?.cnt || 0 })
    }

    res.json(success({
      quotas: {
        keywords: { used: kwCount?.cnt || 0, total: quotas?.max_keywords || 0 },
        questions: { used: qCount?.cnt || 0, total: quotas?.max_questions || 0 },
        indexed: indexedCount?.cnt || 0,
        aiWriting: { used: aiCount?.cnt || 0, total: quotas?.max_ai_writing || 0 },
        publishing: { used: pubCount?.cnt || 0, total: quotas?.max_publishing || 0 },
        mediaAuth: { used: maCount?.cnt || 0, total: quotas?.max_media_auth || 0 },
        vipExpiry: user?.vip_expiry || '',
        imageStorage: quotas?.max_image_storage || 0,
        points: user?.points || 0,
        balance: parseFloat(user?.balance) || 0,
      },
      aiModels,
    }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.get('/consumption/points', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const result = await paginate('score_logs', 'user_id = ?', [req.userId], page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.get('/consumption/balance', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const result = await paginate('balance_logs', 'user_id = ?', [req.userId], page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
