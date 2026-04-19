import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'
import { cached } from '../../common/cache'

export const mediaRouter = Router()

// Catalogs are admin-managed and shared across all users, so the TTL can be
// generous. They dominate the homepage list views, so caching has the best
// hit rate of any endpoint in the app.
const CATALOG_TTL = 300

// ============ Web Media ============

mediaRouter.get('/web', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = (req.query.search as string) || ''

    const key = `media:web:${search}:p${page}:s${pageSize}`
    const result = await cached(key, CATALOG_TTL, async () => {
      let where = 'status = 1'
      const params: any[] = []
      if (search) {
        where += ' AND name LIKE ?'
        params.push(`%${search}%`)
      }
      return paginate('media_outlets', where, params, page, pageSize, 'id ASC')
    })
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ Self-Media ============

mediaRouter.get('/self', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = (req.query.search as string) || ''

    const key = `media:self:${search}:p${page}:s${pageSize}`
    const result = await cached(key, CATALOG_TTL, async () => {
      let where = 'status = 1'
      const params: any[] = []
      if (search) {
        where += ' AND name LIKE ?'
        params.push(`%${search}%`)
      }
      return paginate('selfmedia_outlets', where, params, page, pageSize, 'id ASC')
    })
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ Submissions ============

mediaRouter.post('/submit', async (req: AuthRequest, res) => {
  try {
    const { mediaType, mediaId, mediaName, articleId, title, price } = req.body
    if (!mediaType || !mediaId) return res.json(error('请选择发布媒体'))

    const result = await execute(
      'INSERT INTO submissions (user_id, media_type, media_id, media_name, article_id, title, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, mediaType, mediaId, mediaName || '', articleId || null, title || '', price || 0]
    )
    const item = await queryOne('SELECT * FROM submissions WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.get('/web/records', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = "user_id = ? AND media_type = 'web'"
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (title LIKE ? OR media_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('submissions', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.get('/self/records', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = "user_id = ? AND media_type = 'self'"
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (title LIKE ? OR media_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('submissions', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ Personal Media Accounts ============

mediaRouter.get('/personal/accounts', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (name LIKE ? OR platform LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('user_media_accounts', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.delete('/personal/accounts/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM user_media_accounts WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.delete('/personal/accounts/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM user_media_accounts WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.get('/personal/records', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = "user_id = ? AND media_type = 'personal'"
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (title LIKE ? OR media_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('submissions', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ SEO Sites ============

mediaRouter.get('/seo/sites', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 100
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND domain LIKE ?'
      params.push(`%${search}%`)
    }

    const result = await paginate('sites', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.post('/seo/sites', async (req: AuthRequest, res) => {
  try {
    const { siteType, domain, notes } = req.body
    if (!domain) return res.json(error('域名不能为空'))
    const result = await execute(
      'INSERT INTO sites (user_id, site_type, domain, notes) VALUES (?, ?, ?, ?)',
      [req.userId, siteType || '', domain, notes || '']
    )
    const item = await queryOne('SELECT * FROM sites WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.put('/seo/sites/:id', async (req: AuthRequest, res) => {
  try {
    const { siteType, domain, notes } = req.body
    await execute(
      'UPDATE sites SET site_type = COALESCE(?, site_type), domain = COALESCE(?, domain), notes = COALESCE(?, notes) WHERE id = ? AND user_id = ?',
      [siteType, domain, notes, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM sites WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.delete('/seo/sites/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM sites WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.delete('/seo/sites/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM sites WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

mediaRouter.get('/seo/records', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = "user_id = ? AND media_type = 'seo'"
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (title LIKE ? OR media_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('submissions', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
