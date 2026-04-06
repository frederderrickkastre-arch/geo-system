import { Router } from 'express'
import { success, error } from '../../common/response'
import { AuthRequest } from '../../common/auth.middleware'

export const toolsRouter = Router()

toolsRouter.post('/keyword-index', async (req: AuthRequest, res) => {
  try {
    const { keyword } = req.body
    if (!keyword) return res.json(error('请输入关键词'))

    // Placeholder: in production, call Baidu Index / 5118 / ChinaZ APIs
    res.json(success({
      keyword,
      baiduIndex: Math.floor(Math.random() * 5000),
      soIndex: Math.floor(Math.random() * 3000),
      sogouIndex: Math.floor(Math.random() * 2000),
      competition: ['低', '中', '高'][Math.floor(Math.random() * 3)],
    }))
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
    const words = []
    for (let i = 0; i < count; i++) {
      words.push(`${seedKeyword}${suffixes[i % suffixes.length]}`)
    }

    res.json(success({ words }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})

toolsRouter.post('/manual-expand', async (req: AuthRequest, res) => {
  try {
    const { mainKeyword, lines } = req.body
    if (!mainKeyword) return res.json(error('请输入主关键词'))
    res.json(success({ saved: true, mainKeyword, count: lines?.length || 0 }))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
