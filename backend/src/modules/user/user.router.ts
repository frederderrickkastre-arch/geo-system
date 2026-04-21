import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const userRouter = Router()

function deriveDeviceCode(userId: number): string {
  // 根据 userId 衍生一个稳定的 5 位授权码，便于桌面助手绑定。
  const salt = 3137
  const code = ((userId * 7919 + salt) % 90000) + 10000
  return String(code)
}

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
      deviceCode: deriveDeviceCode(user.id),
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

// 实名认证：查询当前状态
userRouter.get('/verification', async (req: AuthRequest, res) => {
  try {
    const user = await queryOne<any>('SELECT verified, real_name FROM users WHERE id = ?', [req.userId])
    const request = await queryOne<any>(
      'SELECT id, real_name, id_card, id_front, id_back, status, reject_reason, submitted_at, reviewed_at FROM verification_requests WHERE user_id = ?',
      [req.userId]
    )
    res.json(success({
      verified: user?.verified === 1,
      realName: user?.real_name || '',
      request: request || null,
    }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// 实名认证：提交
userRouter.post('/verification', async (req: AuthRequest, res) => {
  try {
    const { realName, idCard, idFront, idBack } = req.body
    if (!realName || !idCard) return res.json(error('请填写真实姓名和身份证号'))
    if (!/^[一-龥·]{2,30}$/.test(realName)) return res.json(error('姓名格式不正确'))
    if (!/^\d{17}[\dXx]$/.test(idCard)) return res.json(error('身份证号格式不正确'))

    const existing = await queryOne<any>('SELECT id, status FROM verification_requests WHERE user_id = ?', [req.userId])
    if (existing?.status === 'approved') return res.json(error('您已通过实名认证'))

    if (existing) {
      await execute(
        `UPDATE verification_requests
         SET real_name = ?, id_card = ?, id_front = ?, id_back = ?, status = 'pending', reject_reason = '', submitted_at = NOW(), reviewed_at = NULL
         WHERE id = ?`,
        [realName, idCard, idFront || '', idBack || '', existing.id]
      )
    } else {
      await execute(
        'INSERT INTO verification_requests (user_id, real_name, id_card, id_front, id_back) VALUES (?, ?, ?, ?, ?)',
        [req.userId, realName, idCard, idFront || '', idBack || '']
      )
    }

    // Demo 环境：提交即视为通过，生产环境应由审核员更新
    await execute('UPDATE users SET verified = 1, real_name = ? WHERE id = ?', [realName, req.userId])
    await execute(
      'UPDATE verification_requests SET status = ?, reviewed_at = NOW() WHERE user_id = ?',
      ['approved', req.userId]
    )

    res.json(success({ verified: true, realName }, '实名认证成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// 发布任务（个人自媒体 / SEO / 自媒体大V / 网站媒体）
userRouter.get('/publish-tasks', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string
    const mediaType = req.query.mediaType as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (mediaType) {
      where += ' AND media_type = ?'
      params.push(mediaType)
    }
    if (search) {
      where += ' AND (name LIKE ? OR target LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('publish_tasks', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.post('/publish-tasks', async (req: AuthRequest, res) => {
  try {
    const { name, mediaType, target, targetId, articleCount } = req.body
    if (!name) return res.json(error('任务名称不能为空'))
    if (!['personal', 'seo', 'self', 'web'].includes(mediaType)) return res.json(error('任务类型不正确'))

    const result = await execute(
      'INSERT INTO publish_tasks (user_id, name, media_type, target, target_id, article_count) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, name, mediaType, target || '', targetId || null, articleCount || 0]
    )
    const item = await queryOne('SELECT * FROM publish_tasks WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.put('/publish-tasks/:id', async (req: AuthRequest, res) => {
  try {
    const { name, target, articleCount, status } = req.body
    await execute(
      `UPDATE publish_tasks
       SET name = COALESCE(?, name),
           target = COALESCE(?, target),
           article_count = COALESCE(?, article_count),
           status = COALESCE(?, status)
       WHERE id = ? AND user_id = ?`,
      [name, target, articleCount, status, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM publish_tasks WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.post('/publish-tasks/:id/start', async (req: AuthRequest, res) => {
  try {
    await execute(
      "UPDATE publish_tasks SET status = 'running', started_at = NOW() WHERE id = ? AND user_id = ? AND status = 'pending'",
      [req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM publish_tasks WHERE id = ?', [req.params.id])
    res.json(success(item, '任务已启动'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.delete('/publish-tasks/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM publish_tasks WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

userRouter.delete('/publish-tasks/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM publish_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
