import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { authRouter } from './modules/auth/auth.router'
import { keywordRouter } from './modules/keyword/keyword.router'
import { questionRouter } from './modules/question/question.router'
import { galleryRouter } from './modules/gallery/gallery.router'
import { knowledgeBaseRouter } from './modules/knowledgeBase/knowledgeBase.router'
import { articleRouter } from './modules/article/article.router'
import { trafficRouter } from './modules/traffic/traffic.router'
import { mediaRouter } from './modules/media/media.router'
import { dataRouter } from './modules/data/data.router'
import { userRouter } from './modules/user/user.router'
import { toolsRouter } from './modules/tools/tools.router'
import { uploadRouter } from './modules/upload/upload.router'
import { adminRouter } from './modules/admin/admin.router'
import { authMiddleware } from './common/auth.middleware'
import { adminAuthMiddleware } from './common/adminAuth.middleware'
import { requestLogger } from './common/logger'
import { rateLimit } from './common/rateLimit'
import { runStartupMigrations } from './common/migrate'
import { queryOne } from './common/db'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((s) => s.trim()), credentials: true } : {}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads')
app.use('/uploads', express.static(uploadDir))

// 登录/注册限流：每 IP 每 10 分钟最多 20 次
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: '登录尝试过于频繁，请稍后再试' })
app.use('/api/auth', authLimiter, authRouter)

app.use('/api/keywords', authMiddleware, keywordRouter)
app.use('/api/questions', authMiddleware, questionRouter)
app.use('/api/galleries', authMiddleware, galleryRouter)
app.use('/api/knowledge-bases', authMiddleware, knowledgeBaseRouter)
app.use('/api/articles', authMiddleware, articleRouter)
app.use('/api/traffic', authMiddleware, trafficRouter)
app.use('/api/media', authMiddleware, mediaRouter)
app.use('/api/data', authMiddleware, dataRouter)
app.use('/api/user', authMiddleware, userRouter)
app.use('/api/tools', authMiddleware, toolsRouter)
app.use('/api/upload', authMiddleware, uploadRouter)
app.use('/api/admin', authMiddleware, adminAuthMiddleware, adminRouter)

app.get('/api/health', async (_req, res) => {
  let db: 'ok' | 'fail' = 'fail'
  try {
    await queryOne('SELECT 1 as ok')
    db = 'ok'
  } catch {}
  res.json({ code: 200, msg: 'ok', data: { status: db === 'ok' ? 'healthy' : 'degraded', db, timestamp: new Date().toISOString() } })
})

app.use((_req, res) => {
  res.status(404).json({ code: 404, msg: 'Not Found', data: null })
})

// 全局错误兜底
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err)
  res.status(500).json({ code: 500, msg: err?.message || 'Internal Server Error', data: null })
})

async function bootstrap() {
  await runStartupMigrations()
  app.listen(PORT, () => {
    console.log(`GEO Backend running on http://localhost:${PORT}`)
  })
}

bootstrap().catch((e) => {
  console.error('bootstrap failed:', e)
  process.exit(1)
})
