import { describe, it, expect } from 'vitest'

// Re-import fresh each test so module-level env evaluation runs again.
async function loadConfig(env: Record<string, string | undefined>) {
  const prev = { ...process.env }
  Object.entries(env).forEach(([k, v]) => {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  })
  try {
    // bust the module cache
    delete require.cache[require.resolve('./config')]
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./config')
  } finally {
    process.env = prev
  }
}

describe('config.ts', () => {
  it('allows dev fallback without a secret', async () => {
    const { config } = await loadConfig({ NODE_ENV: 'development', JWT_SECRET: '' })
    expect(config.jwt.secret).toMatch(/dev-only/)
  })

  it('rejects missing JWT_SECRET in production', async () => {
    await expect(() =>
      loadConfig({ NODE_ENV: 'production', JWT_SECRET: '' })
    ).rejects.toThrow(/JWT_SECRET is required/)
  })

  it('rejects weak JWT_SECRET in production', async () => {
    await expect(() =>
      loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'geo-production-secret-change-me' })
    ).rejects.toThrow(/too weak/)
  })

  it('rejects short JWT_SECRET in production', async () => {
    await expect(() =>
      loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'short' })
    ).rejects.toThrow(/too weak/)
  })

  it('accepts strong JWT_SECRET in production', async () => {
    const { config } = await loadConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(48),
    })
    expect(config.jwt.secret.length).toBe(48)
    expect(config.isProduction).toBe(true)
  })

  it('parses CORS allowlist', async () => {
    const { config } = await loadConfig({
      NODE_ENV: 'development',
      CORS_ORIGIN: 'https://a.com, https://b.com ',
    })
    expect(config.cors.origin).toEqual(['https://a.com', 'https://b.com'])
  })

  it('returns true for wildcard CORS', async () => {
    const { config } = await loadConfig({ NODE_ENV: 'development', CORS_ORIGIN: '*' })
    expect(config.cors.origin).toBe(true)
  })
})
