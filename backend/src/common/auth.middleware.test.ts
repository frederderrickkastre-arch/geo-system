import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { authMiddleware, requireRole } from './auth.middleware'
import { config } from './config'

function buildApp(role?: 'admin' | 'user') {
  const app = express()
  app.get(
    '/admin-only',
    authMiddleware,
    requireRole('admin'),
    (_req, res) => res.json({ ok: true })
  )
  app.get(
    '/authed',
    authMiddleware,
    (_req, res) => res.json({ ok: true })
  )
  return app
}

function tokenFor(role?: 'admin' | 'user') {
  const payload: any = { userId: 1, username: 'alice' }
  if (role) payload.role = role
  return jwt.sign(payload, config.jwt.secret)
}

describe('authMiddleware / requireRole', () => {
  it('401 without bearer token', async () => {
    const r = await request(buildApp()).get('/authed')
    expect(r.status).toBe(401)
  })

  it('401 with a bad token', async () => {
    const r = await request(buildApp()).get('/authed').set('Authorization', 'Bearer broken')
    expect(r.status).toBe(401)
  })

  it('passes through with a valid user token', async () => {
    const r = await request(buildApp())
      .get('/authed')
      .set('Authorization', `Bearer ${tokenFor('user')}`)
    expect(r.status).toBe(200)
  })

  it('403 when a non-admin hits an admin route', async () => {
    const r = await request(buildApp())
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokenFor('user')}`)
    expect(r.status).toBe(403)
  })

  it('200 when an admin hits an admin route', async () => {
    const r = await request(buildApp())
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
    expect(r.status).toBe(200)
  })

  it('legacy tokens without a role claim default to user (403 on admin)', async () => {
    const r = await request(buildApp())
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokenFor()}`)
    expect(r.status).toBe(403)
  })
})
