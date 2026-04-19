import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'
import { cached } from '../../common/cache'

export const userRouter = Router()

// Profile is touched every page load; keep the window short so balance /
// points updates show up quickly. Benefits is heavier (N+1 across 8 AI
// platforms + 7 counts) so a 60s cache is worth the minor staleness.
const PROFILE_TTL = 30
const BENEFITS_TTL = 60

userRouter.get('/profile', async (req: AuthRequest, res) => {
  try {
    const payload = await cached(`user:profile:u${req.userId}`, PROFILE_TTL, async () => {
      const user = await queryOne<any>(
        'SELECT id, username, nickname, avatar, phone, email, vip_expiry, balance, points, verified, real_name FROM users WHERE id = ?',
        [req.userId]
      )
      if (!user) return null
      return {
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
      }
    })
    if (!payload) return res.json(error('用户不存在'))
    res.json(success(payload))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.get('/benefits', async (req: AuthRequest, res) => {
  try {
    const payload = await cached(`user:benefits:u${req.userId}`, BENEFITS_TTL, async () => {
      const user = await queryOne<any>(
        'SELECT vip_expiry, balance, points FROM users WHERE id = ?',
        [req.userId]
      )
      const quotas = await queryOne<any>('SELECT * FROM user_quotas WHERE user_id = ?', [req.userId])

      const kwCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM keywords WHERE user_id = ?', [req.userId])
      const qCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM questions WHERE user_id = ?', [req.userId])
      const aiCount = await queryOne<any>('SELECT COUNT(*) as cnt FROM ai_tasks WHERE user_id = ?', [req.userId])
      const pubCount = await queryOne<any>(
        'SELECT COUNT(*) as cnt FROM submissions WHERE user_id = ?',
        [req.userId]
      )
      const maCount = await queryOne<any>(
        'SELECT COUNT(*) as cnt FROM user_media_accounts WHERE user_id = ?',
        [req.userId]
      )

      const indexedCount = await queryOne<any>(
        'SELECT COUNT(DISTINCT keyword) as cnt FROM platform_indexing WHERE user_id = ? AND indexed = 1',
        [req.userId]
      )

      const PLATFORMS = ['DeepSeek', '豆包', '腾讯元宝', '通义千问', '文心一言', '纳米', 'KIMI', '智谱']
      // One grouped scan instead of 8 round trips — same optimization as /data/report.
      const rows = await query<{ platform: string; cnt: number }>(
        `SELECT platform, COUNT(*) as cnt
           FROM platform_indexing
          WHERE user_id = ? AND indexed = 1 AND platform IN (?, ?, ?, ?, ?, ?, ?, ?)
          GROUP BY platform`,
        [req.userId, ...PLATFORMS]
      )
      const byPlatform = new Map(rows.map((r) => [r.platform, r.cnt]))
      const aiModels = PLATFORMS.map((name) => ({ name, count: byPlatform.get(name) || 0 }))

      return {
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
      }
    })
    res.json(success(payload))
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
