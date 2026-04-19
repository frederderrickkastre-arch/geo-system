// Tests must never touch a real database or Redis. Stub connection-sensitive
// modules here so any import is inert until a test opts into real infra.
import { vi } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-32-chars-minimum-abcdefghij'
process.env.REDIS_ENABLED = 'false'
process.env.LOG_LEVEL = 'silent'

vi.mock('../src/common/db', () => ({
  getPool: vi.fn(),
  query: vi.fn(async () => []),
  queryOne: vi.fn(async () => null),
  execute: vi.fn(async () => ({ insertId: 0, affectedRows: 0 })),
  paginate: vi.fn(async () => ({ list: [], total: 0 })),
  withTransaction: vi.fn(async (fn: any) =>
    fn({
      query: async () => [],
      queryOne: async () => null,
      execute: async () => ({ insertId: 0, affectedRows: 0 }),
    })
  ),
}))
