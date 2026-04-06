import { Router } from 'express'
import { success, error, paginated } from '../../common/response'
import { query, queryOne, execute, paginate } from '../../common/db'
import { AuthRequest } from '../../common/auth.middleware'
import { generateArticle } from '../../common/ai.service'

export const articleRouter = Router()

// ============ Writing Prompts ============

articleRouter.get('/prompts', async (req: AuthRequest, res) => {
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

    const result = await paginate('writing_prompts', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.get('/prompts/all', async (req: AuthRequest, res) => {
  try {
    const list = await query('SELECT id, name FROM writing_prompts WHERE user_id = ? ORDER BY id DESC', [req.userId])
    res.json(success(list))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.post('/prompts', async (req: AuthRequest, res) => {
  try {
    const { name, type, content } = req.body
    if (!name) return res.json(error('指令名称不能为空'))
    const result = await execute(
      'INSERT INTO writing_prompts (user_id, name, type, content) VALUES (?, ?, ?, ?)',
      [req.userId, name, type || 'article', content || '']
    )
    const item = await queryOne('SELECT * FROM writing_prompts WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.put('/prompts/:id', async (req: AuthRequest, res) => {
  try {
    const { name, type, content } = req.body
    await execute(
      'UPDATE writing_prompts SET name = COALESCE(?, name), type = COALESCE(?, type), content = COALESCE(?, content) WHERE id = ? AND user_id = ?',
      [name, type, content, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM writing_prompts WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/prompts/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM writing_prompts WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/prompts/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM writing_prompts WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ Article Categories ============

articleRouter.get('/categories', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 100
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND name LIKE ?'
      params.push(`%${search}%`)
    }

    const result = await paginate('article_categories', where, params, page, pageSize, 'sort ASC, id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.post('/categories', async (req: AuthRequest, res) => {
  try {
    const { name, sort } = req.body
    if (!name) return res.json(error('分类名称不能为空'))
    const result = await execute(
      'INSERT INTO article_categories (user_id, name, sort) VALUES (?, ?, ?)',
      [req.userId, name, sort || 0]
    )
    const item = await queryOne('SELECT * FROM article_categories WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.put('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const { name, sort } = req.body
    await execute(
      'UPDATE article_categories SET name = COALESCE(?, name), sort = COALESCE(?, sort) WHERE id = ? AND user_id = ?',
      [name, sort, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM article_categories WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/categories/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM article_categories WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/categories/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM article_categories WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ AI Tasks ============

articleRouter.get('/tasks', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND (name LIKE ? OR distill_word LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const result = await paginate('ai_tasks', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.post('/tasks', async (req: AuthRequest, res) => {
  try {
    const { name, distillWord, maxCount, knowledgeBaseId, promptId } = req.body
    if (!name) return res.json(error('任务名称不能为空'))
    const result = await execute(
      'INSERT INTO ai_tasks (user_id, name, distill_word, max_count, knowledge_base_id, prompt_id) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, name, distillWord || '', maxCount || 10, knowledgeBaseId || null, promptId || null]
    )
    const item = await queryOne('SELECT * FROM ai_tasks WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.put('/tasks/:id', async (req: AuthRequest, res) => {
  try {
    const { name, distillWord, maxCount, knowledgeBaseId, promptId } = req.body
    await execute(
      'UPDATE ai_tasks SET name = COALESCE(?, name), distill_word = COALESCE(?, distill_word), max_count = COALESCE(?, max_count), knowledge_base_id = ?, prompt_id = ? WHERE id = ? AND user_id = ?',
      [name, distillWord, maxCount, knowledgeBaseId || null, promptId || null, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM ai_tasks WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/tasks/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM ai_tasks WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/tasks/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM ai_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ Articles ============

articleRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string

    let where = 'user_id = ?'
    const params: any[] = [req.userId]
    if (search) {
      where += ' AND title LIKE ?'
      params.push(`%${search}%`)
    }

    const result = await paginate('articles', where, params, page, pageSize, 'id DESC')
    res.json(paginated(result.list, result.total, page, pageSize))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const item = await queryOne('SELECT * FROM articles WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    if (!item) return res.json(error('文章不存在'))
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, content, category, status } = req.body
    if (!title) return res.json(error('标题不能为空'))
    const wordCount = (content || '').length
    const result = await execute(
      'INSERT INTO articles (user_id, title, content, category, word_count, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, title, content || '', category || '', wordCount, status || 'draft']
    )
    const item = await queryOne('SELECT * FROM articles WHERE id = ?', [result.insertId])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { title, content, category, status } = req.body
    const wordCount = content ? content.length : undefined
    await execute(
      'UPDATE articles SET title = COALESCE(?, title), content = COALESCE(?, content), category = COALESCE(?, category), word_count = COALESCE(?, word_count), status = COALESCE(?, status) WHERE id = ? AND user_id = ?',
      [title, content, category, wordCount, status, req.params.id, req.userId]
    )
    const item = await queryOne('SELECT * FROM articles WHERE id = ?', [req.params.id])
    res.json(success(item))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/batch', async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return res.json(error('请选择要删除的数据'))
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM articles WHERE id IN (${ph}) AND user_id = ?`, [...ids, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

articleRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await execute('DELETE FROM articles WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json(success(null, '删除成功'))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

// ============ AI Task Execution ============

articleRouter.post('/tasks/:id/run', async (req: AuthRequest, res) => {
  try {
    const task = await queryOne<any>('SELECT * FROM ai_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    if (!task) return res.json(error('任务不存在'))
    if (task.status === 'running') return res.json(error('任务正在执行中'))

    await execute('UPDATE ai_tasks SET status = ? WHERE id = ?', ['running', task.id])

    const knowledgeContent = task.knowledge_base_id
      ? (await queryOne<any>('SELECT content FROM knowledge_bases WHERE id = ?', [task.knowledge_base_id]))?.content || ''
      : ''

    const promptContent = task.prompt_id
      ? (await queryOne<any>('SELECT content FROM writing_prompts WHERE id = ?', [task.prompt_id]))?.content || ''
      : '请撰写一篇高质量的SEO文章'

    res.json(success({ message: '任务已启动' }))

    ;(async () => {
      try {
        const remaining = task.max_count - task.created_count
        const toCreate = Math.min(remaining, 5)

        for (let i = 0; i < toCreate; i++) {
          const userPrompt = `${promptContent}\n\n关键词：${task.distill_word}\n\n请生成第 ${task.created_count + i + 1} 篇独特的文章。`
          const content = await generateArticle(userPrompt, knowledgeContent, task.distill_word)
          const title = content.split('\n').find((l: string) => l.trim())?.replace(/^#+\s*/, '') || `${task.distill_word} - 文章${task.created_count + i + 1}`
          const wordCount = content.length

          await execute(
            'INSERT INTO articles (user_id, task_id, title, content, word_count, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, task.id, title, content, wordCount, 'draft']
          )
          await execute(
            'UPDATE ai_tasks SET created_count = created_count + 1, last_write_at = NOW() WHERE id = ?',
            [task.id]
          )
        }

        const updatedTask = await queryOne<any>('SELECT * FROM ai_tasks WHERE id = ?', [task.id])
        const newStatus = (updatedTask?.created_count || 0) >= task.max_count ? 'completed' : 'pending'
        await execute('UPDATE ai_tasks SET status = ? WHERE id = ?', [newStatus, task.id])
      } catch (err: any) {
        await execute('UPDATE ai_tasks SET status = ?, error_msg = ? WHERE id = ?', ['failed', err.message, task.id])
      }
    })()
  } catch (e: any) {
    res.json(error(e.message))
  }
})
