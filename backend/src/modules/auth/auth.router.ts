import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { success, error } from '../../common/response'
import { execute, queryOne } from '../../common/db'
import { config } from '../../common/config'
import { authLimiter } from '../../common/rateLimit'
import { recordAudit } from '../../common/audit'
import { validatePassword, validateUsername } from '../../common/password'

export const authRouter = Router()

authRouter.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body || {}
  try {
    if (!username || !password) {
      return res.json(error('请输入账号和密码'))
    }

    const user = await queryOne<any>(
      'SELECT id, username, password, nickname, avatar, vip_expiry, balance, points, status FROM users WHERE username = ?',
      [username]
    )
    if (!user) {
      await recordAudit({ username, action: 'login.fail', detail: 'unknown user' }, req)
      return res.json(error('账号或密码错误'))
    }
    if (user.status === 0) {
      await recordAudit({ userId: user.id, username: user.username, action: 'login.blocked' }, req)
      return res.json(error('账号已被禁用'))
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      await recordAudit({ userId: user.id, username: user.username, action: 'login.fail', detail: 'bad password' }, req)
      return res.json(error('账号或密码错误'))
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    )

    await recordAudit({ userId: user.id, username: user.username, action: 'login.success' }, req)

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
    await recordAudit({ username, action: 'login.fail', detail: e?.message || 'error' }, req)
    res.json(error(e.message || '登录失败'))
  }
})

authRouter.post('/logout', async (req, res) => {
  // Token is stateless; just record the intent for audit.
  await recordAudit({ action: 'logout' }, req)
  res.json(success(null, '退出成功'))
})

authRouter.post('/register', authLimiter, async (req, res) => {
  const { username, password, nickname } = req.body || {}
  try {
    if (!username || !password) {
      return res.json(error('请输入账号和密码'))
    }
    const nameCheck = validateUsername(username)
    if (!nameCheck.ok) return res.json(error(nameCheck.msg))

    const pwCheck = validatePassword(password)
    if (!pwCheck.ok) return res.json(error(pwCheck.msg))

    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username])
    if (existing) {
      await recordAudit({ username, action: 'register.fail', detail: 'duplicate' }, req)
      return res.json(error('用户名已存在'))
    }
    const hashed = await bcrypt.hash(password, 12)
    const result = await execute(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashed, nickname || username]
    )
    await recordAudit({ userId: result.insertId, username, action: 'register.success' }, req)
    res.json(success({ id: result.insertId }, '注册成功'))
  } catch (e: any) {
    await recordAudit({ username, action: 'register.fail', detail: e?.message || 'error' }, req)
    res.json(error(e.message || '注册失败'))
  }
})
