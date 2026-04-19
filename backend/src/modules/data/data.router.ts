import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'
import { checkPlatformIndex, checkAllPlatforms } from '../../common/indexChecker.service'
import { cached, cacheDel } from '../../common/cache'

export const dataRouter = Router()

const PLATFORMS = ['deepseek', '豆包', '元宝', '千问', '文心', '纳米', 'kimi', '智谱']
const REPORT_TTL = 60
const reportKey = (uid: number | undefined) => `data:report:u${uid ?? 0}`

dataRouter.get('/report', async (req: AuthRequest, res) => {
  try {
    const data = await cached(reportKey(req.userId), REPORT_TTL, async () => {
      const questionsRow = await queryOne<any>(
        'SELECT COUNT(*) as cnt FROM questions WHERE user_id = ?',
        [req.userId]
      )
      const totalQuestions = questionsRow?.cnt || 0

      const indexedRow = await queryOne<any>(
        'SELECT COUNT(DISTINCT keyword) as cnt FROM platform_indexing WHERE user_id = ? AND indexed = 1',
        [req.userId]
      )
      const totalIndexed = indexedRow?.cnt || 0

      const wordsRow = await queryOne<any>(
        'SELECT COALESCE(SUM(word_count), 0) as cnt FROM articles WHERE user_id = ?',
        [req.userId]
      )
      const distillWords = wordsRow?.cnt || 0

      // Single grouped scan instead of one query per platform: lets the
      // composite index on (user_id, platform, query_time) do the heavy
      // lifting and keeps the N+1 from growing with PLATFORMS.
      const rows = await query<{ platform: string; cnt: number }>(
        `SELECT platform, COUNT(*) as cnt
           FROM platform_indexing
          WHERE user_id = ? AND indexed = 1 AND platform IN (?, ?, ?, ?, ?, ?, ?, ?)
          GROUP BY platform`,
        [req.userId, ...PLATFORMS]
      )
      const byPlatform = new Map(rows.map((r) => [r.platform, r.cnt]))
      const platformData = PLATFORMS.map((name) => ({ name, indexed: byPlatform.get(name) || 0 }))

      const keywords = await query(
        'SELECT keyword, COUNT(*) as questionCount FROM questions WHERE user_id = ? GROUP BY keyword ORDER BY questionCount DESC LIMIT 50',
        [req.userId]
      )

      return {
        kpi: { totalQuestions, totalIndexed, platforms: PLATFORMS.length, distillWords },
        platformData,
        keywords,
      }
    })
    res.json(success(data))
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
    await cacheDel(reportKey(req.userId))

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

    // Single multi-row insert is cheaper than N round trips and guarantees
    // atomicity — either the whole sweep persists or none of it.
    if (results.length > 0) {
      const values = results.map(() => '(?, ?, ?, ?, ?)').join(', ')
      const params = results.flatMap((r) => [
        req.userId,
        keyword,
        r.platform,
        r.indexed ? 1 : 0,
        r.source,
      ])
      await execute(
        `INSERT INTO platform_indexing (user_id, keyword, platform, indexed, source) VALUES ${values}`,
        params
      )
    }
    await cacheDel(reportKey(req.userId))

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

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND keyword LIKE ?'
      params.push(`%${search}%`)
    }

    const result = await paginate('platform_indexing', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
