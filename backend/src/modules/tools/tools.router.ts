import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { execute, paginate, queryOne } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'

export const toolsRouter = Router()

toolsRouter.post('/keyword-index', async (req: AuthRequest, res) => {
  try {
    const { keyword } = req.body
    if (!keyword) return res.json(error('请输入关键词'))

    // Placeholder: in production, call Baidu Index / 5118 / ChinaZ APIs
    const payload = {
      keyword,
      baiduIndex: Math.floor(Math.random() * 5000),
      soIndex: Math.floor(Math.random() * 3000),
      sogouIndex: Math.floor(Math.random() * 2000),
      competition: ['低', '中', '高'][Math.floor(Math.random() * 3)],
    }

    await execute(
      'INSERT INTO keyword_index_logs (user_id, keyword, baidu_index, so_index, sogou_index, competition) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, keyword, payload.baiduIndex, payload.soIndex, payload.sogouIndex, payload.competition]
    )
    await execute('INSERT INTO score_logs (user_id, project, points) VALUES (?, ?, ?)', [req.userId, `关键词指数查询：${keyword}`, -10])

    res.json(success(payload))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

toolsRouter.get('/keyword-index/history', async (req: AuthRequest, res) => {
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

    const result = await paginate('keyword_index_logs', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

toolsRouter.post('/ai-expand', async (req: AuthRequest, res) => {
  try {
    const { seedKeyword, expandCount } = req.body
    if (!seedKeyword) return res.json(error('请输入种子关键词'))

    const count = Math.min(expandCount || 10, 100)
    // Placeholder: in production, call AI API
    const suffixes = ['怎么样', '多少钱', '哪家好', '推荐', '排名', '价格', '评价', '靠谱吗', '在哪里', '如何选择',
      '品牌', '攻略', '方案', '服务', '优势', '对比', '区别', '注意事项', '流程', '费用']
    const words: string[] = []
    for (let i = 0; i < count; i++) {
      words.push(`${seedKeyword}${suffixes[i % suffixes.length]}`)
    }

    await execute('INSERT INTO score_logs (user_id, project, points) VALUES (?, ?, ?)', [req.userId, `AI拓词：${seedKeyword}`, -count])

    res.json(success({ words }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

toolsRouter.post('/manual-expand', async (req: AuthRequest, res) => {
  try {
    const { mainKeyword, lines } = req.body
    if (!mainKeyword) return res.json(error('请输入主关键词'))

    const words = Array.isArray(lines) ? lines.filter((l: string) => l && l.trim()) : []

    const existing = await queryOne<any>(
      'SELECT id FROM manual_expand_groups WHERE user_id = ? AND main_keyword = ?',
      [req.userId, mainKeyword]
    )

    if (existing) {
      await execute(
        'UPDATE manual_expand_groups SET words = ?, word_count = ? WHERE id = ?',
        [JSON.stringify(words), words.length, existing.id]
      )
      res.json(success({ id: existing.id, mainKeyword, count: words.length }, '已更新'))
    } else {
      const result = await execute(
        'INSERT INTO manual_expand_groups (user_id, main_keyword, words, word_count) VALUES (?, ?, ?, ?)',
        [req.userId, mainKeyword, JSON.stringify(words), words.length]
      )
      res.json(success({ id: result.insertId, mainKeyword, count: words.length }, '保存成功'))
    }
  } catch (e: any) {
    res.json(error(e.message))
  }
})

toolsRouter.get('/manual-expand', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND main_keyword LIKE ?'
      params.push(`%${search}%`)
    }

    const result = await paginate<any>('manual_expand_groups', where, params, page, pageSize, 'id DESC')
    const list = result.list.map((r) => ({ ...r, words: typeof r.words === 'string' ? JSON.parse(r.words || '[]') : r.words }))
    res.json(paginated(list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

toolsRouter.delete('/manual-expand/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM manual_expand_groups WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
