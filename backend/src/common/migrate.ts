import bcrypt from 'bcryptjs'
import { query, queryOne, execute } from './db'

const DEMO_USERNAME = 'geo123'
const DEMO_PASSWORD = 'geo5201314'

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await query<any>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  )
  return rows.length > 0
}

async function ensureRoleColumn() {
  if (!(await columnExists('users', 'role'))) {
    await execute(
      "ALTER TABLE users ADD COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'user' AFTER status"
    )
  }
}

async function ensureDemoAccount() {
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10)
  const existing = await queryOne<any>('SELECT id, password FROM users WHERE username = ?', [DEMO_USERNAME])
  if (existing) {
    const ok = bcrypt.compareSync(DEMO_PASSWORD, existing.password)
    if (!ok) {
      await execute('UPDATE users SET password = ?, role = ? WHERE id = ?', [hash, 'admin', existing.id])
    } else {
      await execute("UPDATE users SET role = 'admin' WHERE id = ? AND role <> 'admin'", [existing.id])
    }
    return existing.id as number
  }
  const result = await execute(
    `INSERT INTO users (username, password, nickname, vip_expiry, status, verified, real_name, role)
     VALUES (?, ?, ?, ?, 1, 1, ?, 'admin')`,
    [DEMO_USERNAME, hash, 'GEO演示', '2066-06-06', '演示号']
  )
  return result.insertId
}

async function ensureQuotas(userId: number) {
  const existing = await queryOne('SELECT id FROM user_quotas WHERE user_id = ?', [userId])
  if (existing) return
  await execute(
    `INSERT INTO user_quotas (user_id, max_keywords, max_questions, max_ai_writing, max_publishing, max_media_auth, max_image_storage)
     VALUES (?, 500, 5000, 1000, 5000, 20, 2048)`,
    [userId]
  )
}

async function seedMediaIfEmpty() {
  const mRow = await queryOne<any>('SELECT COUNT(*) as cnt FROM media_outlets')
  if ((mRow?.cnt || 0) === 0) {
    const rows: any[] = [
      ['新华网（演示）', '["权威","门户"]', '综合', '全国', '主站', 9, 9, '2小时内', 95, 1200, '权威主流门户', 'A', '百度/谷歌', 'dofollow'],
      ['凤凰网（演示）', '["门户","高权"]', '综合', '全国', '主站', 8, 8, '4小时内', 90, 800, '热门门户', 'A', '百度/谷歌', 'dofollow'],
      ['搜狐网（演示）', '["门户"]', '综合', '全国', '频道', 7, 7, '24小时内', 88, 500, '频道页发布', 'B', '百度', 'dofollow'],
      ['中国网（演示）', '["行业"]', '科技', '北京', '频道', 6, 7, '6小时内', 85, 380, '科技行业', 'B', '百度/谷歌', 'dofollow'],
      ['36氪（演示）', '["垂直","科技"]', '科技', '全国', '主站', 7, 8, '12小时内', 80, 660, '科技垂直媒体', 'A', '百度/谷歌', 'dofollow'],
      ['东方财富（演示）', '["财经"]', '财经', '上海', '主站', 8, 8, '8小时内', 82, 520, '财经类媒体', 'A', '百度', 'nofollow'],
    ]
    for (const r of rows) {
      await execute(
        `INSERT INTO media_outlets (name, tags, industry, region, portal, pc_weight, mobile_weight, publish_time, success_rate, price, notes, entry_level, index_type, link_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r
      )
    }
  }

  const sRow = await queryOne<any>('SELECT COUNT(*) as cnt FROM selfmedia_outlets')
  if ((sRow?.cnt || 0) === 0) {
    const rows: any[] = [
      ['头条号·科技前哨（演示）', '今日头条', '科技', '北京', '50万+', '800万', 1, 1, '2小时内', 92, 260, '科技头条号'],
      ['百家号·财经观察（演示）', '百家号', '财经', '上海', '30万+', '500万', 1, 0, '4小时内', 88, 220, '财经百家号'],
      ['小红书·生活（演示）', '小红书', '生活', '广东', '10万+', '100万', 0, 0, '24小时内', 78, 150, '小红书生活博主'],
      ['知乎·科技答主（演示）', '知乎号', '科技', '全国', '20万+', '400万', 1, 0, '12小时内', 85, 180, '知乎高赞答主'],
      ['公众号·行业头条（演示）', '微信公众号', '行业', '全国', '15万+', '300万', 0, 0, '8小时内', 90, 320, '行业公众号'],
    ]
    for (const r of rows) {
      await execute(
        `INSERT INTO selfmedia_outlets (name, platform, industry, region, followers, reads, verified, official, publish_time, success_rate, price, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r
      )
    }
  }
}

export async function runStartupMigrations() {
  try {
    await ensureRoleColumn()
    const demoId = await ensureDemoAccount()
    await ensureQuotas(demoId)
    await seedMediaIfEmpty()
    console.log('[migrate] startup migrations complete')
  } catch (e: any) {
    console.error('[migrate] failed:', e.message)
  }
}
