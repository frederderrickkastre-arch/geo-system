import { Router, type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { success, error } from '../../common/response'
import { AuthRequest } from '../../common/auth.middleware'
import { queryOne, withTransaction } from '../../common/db'

export const uploadRouter = Router()

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Allowlist by extension AND MIME; multer already ships both on each file.
// Anything not in both sets is rejected. This is cheaper and safer than
// trusting either side alone — originalname can be crafted, mimetype comes
// from the upstream client's Content-Type.
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'])
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
])

function safeExt(originalName: string): string | null {
  // Reject anything that contains path separators or NUL bytes up front.
  if (/[\0/\\]/.test(originalName)) return null
  const ext = path.extname(originalName).toLowerCase()
  return ALLOWED_EXT.has(ext) ? ext : null
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = safeExt(file.originalname)
    if (!ext) return cb(new Error('不支持的文件格式'), '')
    // crypto.randomUUID avoids predictable Date.now+Math.random collisions.
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 20,
  },
  fileFilter: (_req, file, cb) => {
    if (!safeExt(file.originalname) || !ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('不支持的文件格式'))
    }
    cb(null, true)
  },
})

// Turn multer's stream errors into structured JSON responses instead of
// Express' default HTML 500 page.
function handleMulterErrors(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!err) return next()
  if (err instanceof multer.MulterError) {
    const map: Record<string, { status: number; msg: string }> = {
      LIMIT_FILE_SIZE: { status: 413, msg: '文件超过大小限制 (10MB)' },
      LIMIT_FILE_COUNT: { status: 413, msg: '文件数量超过限制' },
      LIMIT_UNEXPECTED_FILE: { status: 400, msg: '字段名不正确' },
    }
    const info = map[err.code] || { status: 400, msg: err.message }
    return res.status(info.status).json({ code: info.status, msg: info.msg, data: null })
  }
  if (err instanceof Error) {
    return res.status(400).json({ code: 400, msg: err.message, data: null })
  }
  next(err)
}

async function assertCategoryOwnership(
  categoryId: number | string,
  userId: number | undefined
): Promise<void> {
  const row = await queryOne<{ user_id: number }>(
    'SELECT user_id FROM image_categories WHERE id = ?',
    [categoryId]
  )
  if (!row) throw new Error('分类不存在')
  if (row.user_id !== userId) throw new Error('无权访问该分类')
}

function safeDisplayName(originalName: string): string {
  // Drop any path prefixes, truncate, and strip control chars before storing
  // — originalname shows up in the gallery UI.
  const base = path.basename(originalName).replace(/[\0\r\n\t]/g, '')
  return base.slice(0, 255)
}

uploadRouter.post(
  '/image',
  upload.single('file'),
  handleMulterErrors,
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) return res.json(error('请选择文件'))

      const fileUrl = `/uploads/${req.file.filename}`
      const displayName = safeDisplayName(req.file.originalname)
      const { categoryId } = req.body

      if (categoryId) {
        await assertCategoryOwnership(categoryId, req.userId)
        const inserted = await withTransaction(async (tx) => {
          const result = await tx.execute(
            'INSERT INTO images (category_id, user_id, filename, url, size) VALUES (?, ?, ?, ?, ?)',
            [categoryId, req.userId, displayName, fileUrl, req.file!.size]
          )
          await tx.execute(
            'UPDATE image_categories SET image_count = image_count + 1 WHERE id = ? AND user_id = ?',
            [categoryId, req.userId]
          )
          return tx.queryOne('SELECT * FROM images WHERE id = ?', [result.insertId])
        })
        return res.json(success(inserted))
      }

      res.json(
        success({
          filename: displayName,
          url: fileUrl,
          size: req.file.size,
        })
      )
    } catch (e: any) {
      res.json(error(e.message))
    }
  }
)

uploadRouter.post(
  '/images',
  upload.array('files', 20),
  handleMulterErrors,
  async (req: AuthRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[]
      if (!files?.length) return res.json(error('请选择文件'))

      const { categoryId } = req.body

      if (!categoryId) {
        return res.json(
          success(
            files.map((f) => ({
              filename: safeDisplayName(f.originalname),
              url: `/uploads/${f.filename}`,
              size: f.size,
            }))
          )
        )
      }

      await assertCategoryOwnership(categoryId, req.userId)
      const results = await withTransaction(async (tx) => {
        const out = []
        for (const file of files) {
          const fileUrl = `/uploads/${file.filename}`
          const displayName = safeDisplayName(file.originalname)
          const result = await tx.execute(
            'INSERT INTO images (category_id, user_id, filename, url, size) VALUES (?, ?, ?, ?, ?)',
            [categoryId, req.userId, displayName, fileUrl, file.size]
          )
          out.push({
            id: result.insertId,
            filename: displayName,
            url: fileUrl,
            size: file.size,
          })
        }
        await tx.execute(
          'UPDATE image_categories SET image_count = image_count + ? WHERE id = ? AND user_id = ?',
          [files.length, categoryId, req.userId]
        )
        return out
      })

      res.json(success(results))
    } catch (e: any) {
      res.json(error(e.message))
    }
  }
)
