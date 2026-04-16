// Password policy: at least 8 chars and contain at least two of
// {lowercase, uppercase, digit, symbol}. Keeps the bar reasonable
// without being annoying for legitimate users.
export function validatePassword(pw: string): { ok: true } | { ok: false; msg: string } {
  if (typeof pw !== 'string') return { ok: false, msg: '密码格式无效' }
  if (pw.length < 8) return { ok: false, msg: '密码至少 8 位' }
  if (pw.length > 128) return { ok: false, msg: '密码过长' }

  let classes = 0
  if (/[a-z]/.test(pw)) classes++
  if (/[A-Z]/.test(pw)) classes++
  if (/[0-9]/.test(pw)) classes++
  if (/[^A-Za-z0-9]/.test(pw)) classes++
  if (classes < 2) {
    return { ok: false, msg: '密码需包含字母、数字或符号中的至少两类' }
  }
  return { ok: true }
}

const USERNAME_RE = /^[A-Za-z0-9_.-]{3,32}$/
export function validateUsername(name: string): { ok: true } | { ok: false; msg: string } {
  if (typeof name !== 'string' || !USERNAME_RE.test(name)) {
    return { ok: false, msg: '用户名 3-32 位,仅支持字母数字与 _ . -' }
  }
  return { ok: true }
}
