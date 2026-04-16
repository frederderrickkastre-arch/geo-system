import rateLimit from 'express-rate-limit'

// Login/register: protect against credential stuffing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { code: 429, msg: '请求过于频繁,请稍后再试', data: null },
})

// Looser default for other write-heavy routes if needed later.
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { code: 429, msg: '请求过于频繁,请稍后再试', data: null },
})
