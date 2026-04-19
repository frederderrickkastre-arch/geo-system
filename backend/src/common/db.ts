import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'geo_system',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
      queueLimit: 0,
      charset: 'utf8mb4',
    })
  }
  return pool
}

export async function closePool(): Promise<void> {
  if (pool) {
    const p = pool
    pool = null
    await p.end()
  }
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] || null
}

export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().execute(sql, params)
  return result as mysql.ResultSetHeader
}

export async function paginate<T = any>(
  table: string,
  where: string,
  params: any[],
  page: number,
  pageSize: number,
  orderBy = 'id DESC'
): Promise<{ list: T[]; total: number }> {
  const countSql = `SELECT COUNT(*) as cnt FROM ${table} WHERE ${where}`
  const countResult = await queryOne<{ cnt: number }>(countSql, params)
  const total = countResult?.cnt || 0

  const offset = (page - 1) * pageSize
  const dataSql = `SELECT * FROM ${table} WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  const list = await query<T>(dataSql, [...params, pageSize, offset])

  return { list, total }
}

// Keyset (a.k.a. seek) pagination. OFFSET-based paging scans and discards
// every prior row, so p=10000 is 100x slower than p=1 on a deep table.
// Keyset keeps a cursor ("rows with id < last_seen_id") so cost stays
// constant per page. Only works with a strictly-ordered indexed column
// (we use id DESC here); the tradeoff is you can only move forward/back
// a page at a time, not jump to "page 50".
export interface KeysetPage<T> {
  list: T[]
  // Cursor to pass back for the next page. null once there are no more.
  nextCursor: number | null
}

export async function keysetPaginate<T extends { id: number }>(
  table: string,
  where: string,
  params: any[],
  limit: number,
  cursor?: number | null
): Promise<KeysetPage<T>> {
  const clauses = [where]
  const args = [...params]
  if (cursor && cursor > 0) {
    clauses.push('id < ?')
    args.push(cursor)
  }
  // Fetch limit + 1 so we can tell whether a next page exists without a
  // separate count query.
  args.push(limit + 1)
  const sql = `SELECT * FROM ${table} WHERE ${clauses.join(' AND ')} ORDER BY id DESC LIMIT ?`
  const rows = await query<T>(sql, args)

  const hasMore = rows.length > limit
  const list = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? list[list.length - 1].id : null
  return { list, nextCursor }
}

// Transactional helpers bound to a single pooled connection. The callback
// gets query/queryOne/execute scoped to the transaction; throw anywhere
// inside and the whole thing rolls back.
export interface TxContext {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>
  execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader>
}

export async function withTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection()
  await conn.beginTransaction()
  const tx: TxContext = {
    async query<R = any>(sql: string, params?: any[]) {
      const [rows] = await conn.execute(sql, params)
      return rows as R[]
    },
    async queryOne<R = any>(sql: string, params?: any[]) {
      const [rows] = await conn.execute(sql, params)
      return ((rows as R[])[0] ?? null) as R | null
    },
    async execute(sql: string, params?: any[]) {
      const [result] = await conn.execute(sql, params)
      return result as mysql.ResultSetHeader
    },
  }
  try {
    const result = await fn(tx)
    await conn.commit()
    return result
  } catch (err) {
    try {
      await conn.rollback()
    } catch {
      // rollback best-effort; swallow to preserve the original error
    }
    throw err
  } finally {
    conn.release()
  }
}
