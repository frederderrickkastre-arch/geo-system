import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const trafficRouter = Router()

// ============ Hot Articles ============

trafficRouter.get('/hot-articles', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (title LIKE ? OR url LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('hot_articles', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.post('/hot-articles', async (req: AuthRequest, res) => {
  try {
    const { category, url, title } = req.body
    if (!url) return res.json(error('原文链接不能为空'))
    const result = await execute(
      'INSERT INTO hot_articles (user_id, category, url, title) VALUES (?, ?, ?, ?)',
      [req.userId, category || '', url, title || '']
    )
    const item = await queryOne('SELECT * FROM hot_articles WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.put('/hot-articles/:id', async (req: AuthRequest, res) => {
  try {
    const { category, url, title } = req.body
    await execute(
      'UPDATE hot_articles SET category = COALESCE(?, category), url = COALESCE(?, url), title = COALESCE(?, title) WHERE id = ? AND user_id = ?',
      [category, url, title, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM hot_articles WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.delete('/hot-articles/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM hot_articles WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.delete('/hot-articles/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM hot_articles WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ Batch Rewrite Tasks ============

trafficRouter.get('/batch-rewrite', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (name LIKE ? OR keyword LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('batch_rewrite_tasks', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.post('/batch-rewrite', async (req: AuthRequest, res) => {
  try {
    const { name, keyword, maxRewrite } = req.body
    if (!name) return res.json(error('任务名称不能为空'))
    const result = await execute(
      'INSERT INTO batch_rewrite_tasks (user_id, name, keyword, max_rewrite) VALUES (?, ?, ?, ?)',
      [req.userId, name, keyword || '', maxRewrite || 50]
    )
    const item = await queryOne('SELECT * FROM batch_rewrite_tasks WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.put('/batch-rewrite/:id', async (req: AuthRequest, res) => {
  try {
    const { name, keyword, maxRewrite } = req.body
    await execute(
      'UPDATE batch_rewrite_tasks SET name = COALESCE(?, name), keyword = COALESCE(?, keyword), max_rewrite = COALESCE(?, max_rewrite) WHERE id = ? AND user_id = ?',
      [name, keyword, maxRewrite, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM batch_rewrite_tasks WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.delete('/batch-rewrite/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM batch_rewrite_tasks WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

trafficRouter.delete('/batch-rewrite/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM batch_rewrite_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
