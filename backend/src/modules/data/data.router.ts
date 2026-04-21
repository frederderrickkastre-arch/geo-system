import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'
import { checkPlatformIndex, checkAllPlatforms } from '../../common/indexChecker.service'

export const dataRouter = Router()

const PLATFORMS = ['deepseek', '豆包', '元宝', '千问', '文心', '纳米', 'kimi', '智谱']

dataRouter.get('/report', async (req: AuthRequest, res) => {
  try {
    const questionsRow = await queryOne<any>('SELECT COUNT(*) as cnt FROM questions WHERE user_id = ?', [req.userId])
    const totalQuestions = questionsRow?.cnt || 0

    const indexedRow = await queryOne<any>(
      'SELECT COUNT(DISTINCT keyword) as cnt FROM platform_indexing WHERE user_id = ? AND indexed = 1',
      [req.userId]
    )
    const totalIndexed = indexedRow?.cnt || 0

    const wordsRow = await queryOne<any>('SELECT COALESCE(SUM(word_count), 0) as cnt FROM articles WHERE user_id = ?', [req.userId])
    const distillWords = wordsRow?.cnt || 0

    const platformData = []
    for (const p of PLATFORMS) {
      const row = await queryOne<any>(
        'SELECT COUNT(*) as cnt FROM platform_indexing WHERE user_id = ? AND platform = ? AND indexed = 1',
        [req.userId, p]
      )
      platformData.push({ name: p, indexed: row?.cnt || 0 })
    }

    const keywords = await query(
      'SELECT keyword, COUNT(*) as questionCount FROM questions WHERE user_id = ? GROUP BY keyword ORDER BY questionCount DESC LIMIT 50',
      [req.userId]
    )

    res.json(success({
      kpi: { totalQuestions, totalIndexed, platforms: PLATFORMS.length, distillWords },
      platformData,
      keywords,
    }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

dataRouter.post('/query', async (req: AuthRequest, res) => {
  try {
    const { keyword, platform } = req.body
    if (!keyword || !platform) return res.json(error('请输入关键词和平台'))

    const result = await checkPlatformIndex(keyword, platform)

    await execute(
      'INSERT INTO platform_indexing (user_id, keyword, platform, indexed, source) VALUES (?, ?, ?, ?, ?)',
      [req.userId, keyword, platform, result.indexed ? 1 : 0, result.source]
    )

    res.json(success({
      keyword,
      platform,
      indexed: result.indexed,
      queryTime: new Date().toISOString(),
    }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

dataRouter.post('/query-all', async (req: AuthRequest, res) => {
  try {
    const { keyword } = req.body
    if (!keyword) return res.json(error('请输入关键词'))

    const results = await checkAllPlatforms(keyword)

    for (const r of results) {
      await execute(
        'INSERT INTO platform_indexing (user_id, keyword, platform, indexed, source) VALUES (?, ?, ?, ?, ?)',
        [req.userId, keyword, r.platform, r.indexed ? 1 : 0, r.source]
      )
    }

    res.json(success({
      keyword,
      results,
      queryTime: new Date().toISOString(),
    }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

dataRouter.get('/query-records', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string
    const platform = req.query.platform as string
    const indexed = req.query.indexed as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND keyword LIKE ?'
      params.push(`%${search}%`)
    }
    if (platform) {
      where += ' AND platform = ?'
      params.push(platform)
    }
    if (indexed === '0' || indexed === '1') {
      where += ' AND indexed = ?'
      params.push(parseInt(indexed))
    }
    if (startDate) {
      where += ' AND query_time >= ?'
      params.push(`${startDate} 00:00:00`)
    }
    if (endDate) {
      where += ' AND query_time <= ?'
      params.push(`${endDate} 23:59:59`)
    }

    const result = await paginate('platform_indexing', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
