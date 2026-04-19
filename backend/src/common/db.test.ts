import { describe, it, expect, vi, beforeEach } from 'vitest'

// The global test setup stubs './db' wholesale for consumers; here we want
// the real implementation so we can verify transaction flow. Unstub it and
// replace mysql2 with a synthetic pool.
vi.doUnmock('./db')

const calls: string[] = []
const mockConnection = {
  execute: vi.fn(async (sql: string) => {
    calls.push(sql)
    if (sql.startsWith('BOOM')) throw new Error('forced')
    return [[] as any, [] as any]
  }),
  beginTransaction: vi.fn(async () => calls.push('BEGIN')),
  commit: vi.fn(async () => calls.push('COMMIT')),
  rollback: vi.fn(async () => calls.push('ROLLBACK')),
  release: vi.fn(() => calls.push('RELEASE')),
}

const poolExecute = vi.fn(async (_sql: string, _params?: any[]) => [
  [] as any,
  [] as any,
])

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: () => ({
      getConnection: async () => mockConnection,
      execute: (sql: string, params?: any[]) => poolExecute(sql, params),
      end: async () => undefined,
    }),
  },
}))

// Late import so the mock takes effect.
import { withTransaction, keysetPaginate } from './db'

describe('withTransaction', () => {
  beforeEach(() => {
    calls.length = 0
    mockConnection.execute.mockClear()
    mockConnection.beginTransaction.mockClear()
    mockConnection.commit.mockClear()
    mockConnection.rollback.mockClear()
    mockConnection.release.mockClear()
  })

  it('commits on success and releases the connection', async () => {
    await withTransaction(async (tx) => {
      await tx.execute('INSERT ...')
    })
    expect(calls).toEqual(['BEGIN', 'INSERT ...', 'COMMIT', 'RELEASE'])
  })

  it('rolls back and rethrows when the callback throws', async () => {
    await expect(
      withTransaction(async (tx) => {
        await tx.execute('BOOM')
      })
    ).rejects.toThrow('forced')
    expect(calls).toEqual(['BEGIN', 'BOOM', 'ROLLBACK', 'RELEASE'])
  })
})

describe('keysetPaginate', () => {
  beforeEach(() => {
    poolExecute.mockReset()
  })

  it('fetches limit+1 rows, reports nextCursor when a next page exists', async () => {
    // limit=2, return 3 rows -> hasMore=true, cursor from last kept row.
    poolExecute.mockResolvedValueOnce([
      [
        { id: 10, user_id: 1 },
        { id: 9, user_id: 1 },
        { id: 8, user_id: 1 },
      ] as any,
      [] as any,
    ])
    const page = await keysetPaginate('score_logs', 'user_id = ?', [1], 2)
    expect(page.list.map((r) => r.id)).toEqual([10, 9])
    expect(page.nextCursor).toBe(9)

    const [sql, params] = poolExecute.mock.calls[0]
    expect(sql).toMatch(/ORDER BY id DESC LIMIT \?/)
    expect(sql).not.toMatch(/id < \?/)
    expect(params).toEqual([1, 3]) // limit + 1
  })

  it('applies cursor clause on subsequent pages', async () => {
    poolExecute.mockResolvedValueOnce([[{ id: 7, user_id: 1 }] as any, [] as any])
    const page = await keysetPaginate('score_logs', 'user_id = ?', [1], 2, 9)
    expect(page.list.map((r) => r.id)).toEqual([7])
    expect(page.nextCursor).toBeNull()

    const [sql, params] = poolExecute.mock.calls[0]
    expect(sql).toMatch(/id < \?/)
    expect(params).toEqual([1, 9, 3])
  })
})
