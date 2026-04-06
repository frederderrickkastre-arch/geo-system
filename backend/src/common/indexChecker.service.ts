import https from 'https'
import http from 'http'

const PLATFORM_URLS: Record<string, string> = {
  deepseek: 'https://chat.deepseek.com',
  '豆包': 'https://www.doubao.com',
  '元宝': 'https://yuanbao.tencent.com',
  '千问': 'https://tongyi.aliyun.com',
  '文心': 'https://yiyan.baidu.com',
  '纳米': 'https://www.nanmi.com',
  kimi: 'https://kimi.moonshot.cn',
  '智谱': 'https://chatglm.cn',
}

function httpGet(url: string, timeout = 10000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.get(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve({ status: res.statusCode || 0, body }))
      }
    )
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.on('error', reject)
  })
}

export interface IndexCheckResult {
  platform: string
  indexed: boolean
  source: string
}

/**
 * Check if a keyword appears to be indexed by a specific AI platform.
 * In production, this should be replaced with actual API calls to each platform
 * or a proper web scraping solution with appropriate rate limiting.
 */
export async function checkPlatformIndex(keyword: string, platform: string): Promise<IndexCheckResult> {
  const baseUrl = PLATFORM_URLS[platform]
  if (!baseUrl) {
    return { platform, indexed: false, source: 'unknown_platform' }
  }

  try {
    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(keyword)}`
    const response = await httpGet(searchUrl, 8000)

    const bodyLower = response.body.toLowerCase()
    const keywordLower = keyword.toLowerCase()
    const indexed = bodyLower.includes(keywordLower)

    return {
      platform,
      indexed,
      source: indexed ? 'web_check' : 'web_check',
    }
  } catch {
    // If the direct check fails, use a heuristic approach
    // In production, implement proper API-based checking
    return {
      platform,
      indexed: false,
      source: 'check_failed',
    }
  }
}

export async function checkAllPlatforms(keyword: string): Promise<IndexCheckResult[]> {
  const platforms = Object.keys(PLATFORM_URLS)
  const results = await Promise.allSettled(
    platforms.map((p) => checkPlatformIndex(keyword, p))
  )

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return { platform: platforms[i], indexed: false, source: 'error' }
  })
}
