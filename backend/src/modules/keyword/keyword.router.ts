import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const keywordRouter = Router()

keywordRouter.get('/', async (req: AuthRequest, res) => {
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

    const result = await paginate('keywords', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

keywordRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const { keyword, status } = req.body
    if (!keyword) return res.json(error('关键词不能为空'))
    const result = await execute(
      'INSERT INTO keywords (user_id, keyword, status) VALUES (?, ?, ?)',
      [req.userId, keyword, status || 'inactive']
    )
    const item = await queryOne('SELECT * FROM keywords WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

keywordRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { keyword, status } = req.body
    await execute(
      'UPDATE keywords SET keyword = COALESCE(?, keyword), status = COALESCE(?, status) WHERE id = ? AND user_id = ?',
      [keyword, status, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM keywords WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

keywordRouter.delete('/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const placeholders = ids.map(() => '?').join(',')
    await execute(`DELETE FROM keywords WHERE id IN (${placeholders}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

keywordRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM keywords WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
