import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const galleryRouter = Router()

// --- Image Categories ---
galleryRouter.get('/categories', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND name LIKE ?'
      params.push(`%${search}%`)
    }

    const result = await paginate('image_categories', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

galleryRouter.post('/categories', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body
    if (!name) return res.json(error('分类名称不能为空'))
    const result = await execute(
      'INSERT INTO image_categories (user_id, name) VALUES (?, ?)',
      [req.userId, name]
    )
    const item = await queryOne('SELECT * FROM image_categories WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

galleryRouter.put('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body
    await execute(
      'UPDATE image_categories SET name = ? WHERE id = ? AND user_id = ?',
      [name, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM image_categories WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

galleryRouter.delete('/categories/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const placeholders = ids.map(() => '?').join(',')
    await execute(`DELETE FROM images WHERE category_id IN (${placeholders}) AND user_id = ?`, [...ids, req.userId])
    await execute(`DELETE FROM image_categories WHERE id IN (${placeholders}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

galleryRouter.delete('/categories/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM images WHERE category_id = ? AND user_id = ?', [req.params.id, req.userId])
    await execute('DELETE FROM image_categories WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// --- Images within a category ---
galleryRouter.get('/categories/:id/images', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = await paginate(
      'images',
      'category_id = ? AND user_id = ?',
      [req.params.id, req.userId],
      page,
      pageSize,
      'id DESC'
    )
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

galleryRouter.post('/categories/:id/images', async (req: AuthRequest, res) => {
  try {
    const { filename, url, size } = req.body
    if (!url) return res.json(error('图片URL不能为空'))
    const result = await execute(
      'INSERT INTO images (category_id, user_id, filename, url, size) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.userId, filename || '', url, size || 0]
    )
    await execute(
      'UPDATE image_categories SET image_count = image_count + 1 WHERE id = ?',
      [req.params.id]
    )
    const item = await queryOne('SELECT * FROM images WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

galleryRouter.delete('/images/:id', async (req: AuthRequest, res) => {
  try {
    const img = await queryOne<any>('SELECT category_id FROM images WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    await execute('DELETE FROM images WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    if (img) {
      await execute('UPDATE image_categories SET image_count = GREATEST(image_count - 1, 0) WHERE id = ?', [img.category_id])
    }
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
