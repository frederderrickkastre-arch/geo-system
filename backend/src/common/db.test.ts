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

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: () => ({
      getConnection: async () => mockConnection,
      execute: async () => [[] as any, [] as any],
      end: async () => undefined,
    }),
  },
}))

// Late import so the mock takes effect.
import { withTransaction } from './db'

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
