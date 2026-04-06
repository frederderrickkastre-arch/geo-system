import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { success, error } from '../../common/response'
import { queryOne } from '../../common/db'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.json(error('请输入账号和密码'))
    }

    const user = await queryOne<any>(
      'SELECT id, username, password, nickname, avatar, vip_expiry, balance, points, status FROM users WHERE username = ?',
      [username]
    )
    if (!user) {
      return res.json(error('账号或密码错误'))
    }
    if (user.status === 0) {
      return res.json(error('账号已被禁用'))
    }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      return res.json(error('账号或密码错误'))
    }

    const secret = process.env.JWT_SECRET || 'geo-secret'
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      secret,
      { expiresIn } as jwt.SignOptions
    )

    res.json(success({
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || '',
        avatar: user.avatar || '',
        vipExpiry: user.vip_expiry || '',
        balance: parseFloat(user.balance) || 0,
        points: user.points || 0,
      },
    }))
  } catch (e: any) {
    res.json(error(e.message || '登录失败'))
  }
})

authRouter.post('/logout', (_req, res) => {
  res.json(success(null, '退出成功'))
})

authRouter.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body
    if (!username || !password) {
      return res.json(error('请输入账号和密码'))
    }
    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username])
    if (existing) {
      return res.json(error('用户名已存在'))
    }
    const hashed = bcrypt.hashSync(password, 10)
    const { execute } = await import('../../common/db')
    const result = await execute(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashed, nickname || username]
    )
    res.json(success({ id: result.insertId }, '注册成功'))
  } catch (e: any) {
    res.json(error(e.message || '注册失败'))
  }
})
