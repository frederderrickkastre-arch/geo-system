import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { success, error } from '../../common/response'
import { AuthRequest } from '../../common/auth.middleware'
import { execute, queryOne } from '../../common/db'

export const uploadRouter = Router()

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件格式'))
    }
  },
})

uploadRouter.post('/image', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.json(error('请选择文件'))

    const fileUrl = `/uploads/${req.file.filename}`
    const { categoryId } = req.body

    if (categoryId) {
      const result = await execute(
        'INSERT INTO images (category_id, user_id, filename, url, size) VALUES (?, ?, ?, ?, ?)',
        [categoryId, req.userId, req.file.originalname, fileUrl, req.file.size]
      )
      await execute(
        'UPDATE image_categories SET image_count = image_count + 1 WHERE id = ?',
        [categoryId]
      )
      const item = await queryOne('SELECT * FROM images WHERE id = ?', [result.insertId])
      res.json(success(item))
    } else {
      res.json(success({
        filename: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
      }))
    }
  } catch (e: any) {
    res.json(error(e.message))
  }
})

uploadRouter.post('/images', upload.array('files', 20), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files?.length) return res.json(error('请选择文件'))

    const { categoryId } = req.body
    const results = []

    for (const file of files) {
      const fileUrl = `/uploads/${file.filename}`
      if (categoryId) {
        const result = await execute(
          'INSERT INTO images (category_id, user_id, filename, url, size) VALUES (?, ?, ?, ?, ?)',
          [categoryId, req.userId, file.originalname, fileUrl, file.size]
        )
        await execute(
          'UPDATE image_categories SET image_count = image_count + 1 WHERE id = ?',
          [categoryId]
        )
        results.push({ id: result.insertId, filename: file.originalname, url: fileUrl, size: file.size })
      } else {
        results.push({ filename: file.originalname, url: fileUrl, size: file.size })
      }
    }

    res.json(success(results))
  } catch (e: any) {
    res.json(error(e.message))
  }
})
