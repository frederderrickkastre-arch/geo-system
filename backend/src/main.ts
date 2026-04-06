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
import { authMiddleware } from './common/auth.middleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads')
app.use('/uploads', express.static(uploadDir))

app.use('/api/auth', authRouter)

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

app.get('/api/health', (_req, res) => {
  res.json({ code: 200, msg: 'ok', data: { status: 'healthy', timestamp: new Date().toISOString() } })
})

app.listen(PORT, () => {
  console.log(`GEO Backend running on http://localhost:${PORT}`)
})
