import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { HttpError, errorHandler, notFoundHandler } from './errorHandler'

function app(err: Error) {
  const a = express()
  a.get('/boom', (_req, _res, next) => next(err))
  a.use('/api', notFoundHandler)
  a.use(errorHandler)
  return a
}

describe('errorHandler', () => {
  it('maps HttpError to its status', async () => {
    const r = await request(app(new HttpError(422, 'bad'))).get('/boom')
    expect(r.status).toBe(422)
    expect(r.body).toMatchObject({ code: 422, msg: 'bad' })
  })

  it('defaults unknown errors to 500 and logs', async () => {
    const err = new Error('kaboom')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = await request(app(err)).get('/boom')
    expect(r.status).toBe(500)
    expect(r.body.code).toBe(500)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('notFoundHandler returns 404 JSON under /api', async () => {
    const a = express()
    a.use('/api', notFoundHandler)
    const r = await request(a).get('/api/does-not-exist')
    expect(r.status).toBe(404)
    expect(r.body.code).toBe(404)
  })
})
