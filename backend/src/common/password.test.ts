import { describe, it, expect } from 'vitest'
import { validatePassword, validateUsername } from './password'

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('Ab3')).toEqual({ ok: false, msg: '密码至少 8 位' })
  })

  it('rejects single-class passwords', () => {
    expect(validatePassword('aaaaaaaa')).toMatchObject({ ok: false })
    expect(validatePassword('11111111')).toMatchObject({ ok: false })
  })

  it('accepts two-class passwords', () => {
    expect(validatePassword('password1')).toEqual({ ok: true })
    expect(validatePassword('Password')).toEqual({ ok: true })
    expect(validatePassword('pass-word')).toEqual({ ok: true })
  })

  it('rejects overly long passwords', () => {
    expect(validatePassword('A1'.repeat(70))).toEqual({ ok: false, msg: '密码过长' })
  })

  it('rejects non-string input', () => {
    // @ts-expect-error intentional
    expect(validatePassword(null)).toMatchObject({ ok: false })
  })
})

describe('validateUsername', () => {
  it('accepts allowed characters', () => {
    expect(validateUsername('alice')).toEqual({ ok: true })
    expect(validateUsername('a.b_c-1')).toEqual({ ok: true })
  })

  it('rejects too short / too long', () => {
    expect(validateUsername('ab')).toMatchObject({ ok: false })
    expect(validateUsername('a'.repeat(33))).toMatchObject({ ok: false })
  })

  it('rejects disallowed characters', () => {
    expect(validateUsername('foo bar')).toMatchObject({ ok: false })
    expect(validateUsername('foo@bar')).toMatchObject({ ok: false })
  })
})
