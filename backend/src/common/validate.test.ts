import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { validateBody, validateQuery, z } from './validate'

function buildApp(middleware: any, handler = (_req: any, res: any) => res.json({ ok: true })) {
  const app = express()
  app.use(express.json())
  app.post('/test', middleware, handler)
  app.get('/test', middleware, handler)
  return app
}

describe('validateBody', () => {
  const schema = z.object({
    name: z.string().trim().min(1),
    count: z.coerce.number().int().positive(),
  })

  it('passes and coerces valid input', async () => {
    const app = buildApp(validateBody(schema), (req, res) => res.json(req.body))
    const r = await request(app).post('/test').send({ name: ' alice ', count: '7' })
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ name: 'alice', count: 7 })
  })

  it('returns a 400 with field-level errors on miss', async () => {
    const app = buildApp(validateBody(schema))
    const r = await request(app).post('/test').send({ count: -1 })
    expect(r.status).toBe(400)
    expect(r.body.code).toBe(400)
    expect(r.body.data.errors.map((e: any) => e.path).sort()).toEqual(['count', 'name'])
  })
})

describe('validateQuery', () => {
  const schema = z.object({
    page: z.coerce.number().int().positive().default(1),
  })

  it('coerces string query params to numbers', async () => {
    const app = buildApp(validateQuery(schema), (req, res) => res.json(req.query))
    const r = await request(app).get('/test').query({ page: '3' })
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ page: 3 })
  })

  it('rejects non-numeric page', async () => {
    const app = buildApp(validateQuery(schema))
    const r = await request(app).get('/test').query({ page: 'abc' })
    expect(r.status).toBe(400)
  })
})
