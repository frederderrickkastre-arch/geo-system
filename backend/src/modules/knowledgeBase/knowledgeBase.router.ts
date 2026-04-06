import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const knowledgeBaseRouter = Router()

knowledgeBaseRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (name LIKE ? OR company LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('knowledge_bases', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

knowledgeBaseRouter.get('/all', async (req: AuthRequest, res) => {
  try {
    const { query: dbQuery } = await import('../../common/db')
    const list = await dbQuery('SELECT id, name FROM knowledge_bases WHERE user_id = ? ORDER BY id DESC', [req.userId])
    res.json(success(list))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

knowledgeBaseRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, company, content } = req.body
    if (!name) return res.json(error('名称不能为空'))
    const result = await execute(
      'INSERT INTO knowledge_bases (user_id, name, company, content) VALUES (?, ?, ?, ?)',
      [req.userId, name, company || '', content || '']
    )
    const item = await queryOne('SELECT * FROM knowledge_bases WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

knowledgeBaseRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, company, content } = req.body
    await execute(
      'UPDATE knowledge_bases SET name = COALESCE(?, name), company = COALESCE(?, company), content = COALESCE(?, content) WHERE id = ? AND user_id = ?',
      [name, company, content, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM knowledge_bases WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

knowledgeBaseRouter.delete('/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const placeholders = ids.map(() => '?').join(',')
    await execute(`DELETE FROM knowledge_bases WHERE id IN (${placeholders}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

knowledgeBaseRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM knowledge_bases WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
