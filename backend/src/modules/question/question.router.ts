import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const questionRouter = Router()

questionRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (keyword LIKE ? OR question LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('questions', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

questionRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const { keyword, question } = req.body
    if (!question) return res.json(error('问题不能为空'))
    const result = await execute(
      'INSERT INTO questions (user_id, keyword, question) VALUES (?, ?, ?)',
      [req.userId, keyword || '', question]
    )
    const item = await queryOne('SELECT * FROM questions WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

questionRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { keyword, question } = req.body
    await execute(
      'UPDATE questions SET keyword = COALESCE(?, keyword), question = COALESCE(?, question) WHERE id = ? AND user_id = ?',
      [keyword, question, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM questions WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

questionRouter.delete('/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const placeholders = ids.map(() => '?').join(',')
    await execute(`DELETE FROM questions WHERE id IN (${placeholders}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

questionRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM questions WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
