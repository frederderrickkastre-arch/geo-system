import { describe, it, expect } from 'vitest'
import { success, error, paginated } from './response'

describe('response helpers', () => {
  it('success wraps data', () => {
    expect(success({ a: 1 })).toEqual({ code: 200, msg: 'success', data: { a: 1 } })
  })

  it('error defaults to code 400', () => {
    expect(error('bad')).toEqual({ code: 400, msg: 'bad', data: null })
  })

  it('paginated echoes paging metadata', () => {
    const r = paginated([{ id: 1 }], 42, 2, 10)
    expect(r.code).toBe(200)
    expect(r.data).toEqual({ list: [{ id: 1 }], total: 42, page: 2, pageSize: 10 })
  })
})
