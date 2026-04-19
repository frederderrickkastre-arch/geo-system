import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import pinoHttp from 'pino-http'
import { config } from './common/config'
import { logger } from './common/logger'
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
import { authMiddleware, requireRole } from './common/auth.middleware'
import { generalApiLimiter } from './common/rateLimit'
import { errorHandler, notFoundHandler } from './common/errorHandler'
import { closePool, query } from './common/db'
import { cachePing, closeCache } from './common/cache'

const app = express()

app.set('trust proxy', 1)

app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    autoLogging: {
      ignore: (req) => req.url === '/api/health' || req.url === '/api/healthz',
    },
  })
)

app.use(
  helmet({
    // SPA assets are served separately by nginx; relax CSP here so dev tooling
    // (and image previews from /uploads) keep working without extra config.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const uploadDir = path.resolve(config.uploadDir)
app.use('/uploads', express.static(uploadDir))

// Liveness — cheap, never touches dependencies. Use for k8s livenessProbe.
app.get('/api/health', (_req, res) => {
  res.json({ code: 200, msg: 'ok', data: { status: 'healthy', timestamp: new Date().toISOString() } })
})

// Readiness — checks downstreams. Use for k8s readinessProbe / load balancers.
app.get('/api/healthz', async (_req, res) => {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

  const dbStart = Date.now()
  try {
    await query('SELECT 1 AS ok')
    checks.db = { ok: true, latencyMs: Date.now() - dbStart }
  } catch (e: any) {
    checks.db = { ok: false, latencyMs: Date.now() - dbStart, error: e?.message }
  }

  const redisStart = Date.now()
  const redisOk = await cachePing()
  checks.redis = { ok: redisOk, latencyMs: Date.now() - redisStart }

  const allOk = Object.values(checks).every((c) => c.ok)
  res.status(allOk ? 200 : 503).json({
    code: allOk ? 200 : 503,
    msg: allOk ? 'ok' : 'degraded',
    data: { status: allOk ? 'ready' : 'not-ready', checks, timestamp: new Date().toISOString() },
  })
})

app.use('/api/auth', authRouter)

app.use('/api', generalApiLimiter)

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
app.use('/api/admin', authMiddleware, requireRole('admin'), adminRouter)

app.use('/api', notFoundHandler)
app.use(errorHandler)

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'GEO Backend listening')
})

let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  // hard timeout in case of stuck connections
  const hardTimer = setTimeout(() => {
    logger.error('shutdown timed out, forcing exit')
    process.exit(1)
  }, 10_000)
  hardTimer.unref()

  server.close(async (err) => {
    try {
      if (err) logger.error({ err }, 'server close failed')
      await Promise.allSettled([closePool(), closeCache()])
    } finally {
      process.exit(err ? 1 : 0)
    }
  })
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
