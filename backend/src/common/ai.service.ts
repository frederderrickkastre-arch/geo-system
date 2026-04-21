import https from 'https'
import http from 'http'

export interface AIConfig {
  provider: 'deepseek' | 'qianwen' | 'wenxin' | 'openai'
  apiKey: string
  baseUrl?: string
  model?: string
}

function getConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'deepseek') as AIConfig['provider']
  const apiKey = process.env.AI_API_KEY || ''
  const baseUrl = process.env.AI_BASE_URL || ''
  const model = process.env.AI_MODEL || ''
  return { provider, apiKey, baseUrl, model }
}

/**
 * 把用户提供的 base URL 规整成最终的 /chat/completions 完整地址。
 * 常见中转站会给下面几种形式，都要能正确接上：
 *   - https://api.example.com                 → 追加 /v1/chat/completions
 *   - https://api.example.com/v1              → 追加 /chat/completions
 *   - https://api.example.com/v1/             → 追加 chat/completions
 *   - https://api.example.com/v1/chat/completions → 保持不变
 */
function normalizeChatUrl(base: string): string {
  let url = base.trim().replace(/\/+$/, '')
  if (url.endsWith('/chat/completions')) return url
  if (url.endsWith('/v1')) return `${url}/chat/completions`
  if (/\/v\d+$/.test(url)) return `${url}/chat/completions`
  return `${url}/v1/chat/completions`
}

function getEndpoint(config: AIConfig): { url: string; model: string } {
  if (config.baseUrl) {
    return {
      url: normalizeChatUrl(config.baseUrl),
      model: config.model || 'deepseek-chat',
    }
  }
  switch (config.provider) {
    case 'deepseek':
      return { url: 'https://api.deepseek.com/v1/chat/completions', model: config.model || 'deepseek-chat' }
    case 'qianwen':
      return { url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: config.model || 'qwen-turbo' }
    case 'wenxin':
      return { url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', model: config.model || 'ernie-bot' }
    case 'openai':
      return { url: 'https://api.openai.com/v1/chat/completions', model: config.model || 'gpt-4o-mini' }
    default:
      return { url: 'https://api.deepseek.com/v1/chat/completions', model: config.model || 'deepseek-chat' }
  }
}

function httpPost(url: string, headers: Record<string, string>, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`AI API error ${res.statusCode}: ${data}`))
          } else {
            resolve(data)
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

export interface AIInspectResult {
  ok: boolean
  provider: string
  url: string
  model: string
  sample?: string
  error?: string
}

export async function testAIConnection(): Promise<AIInspectResult> {
  const config = getConfig()
  const endpoint = getEndpoint(config)

  if (!config.apiKey) {
    return { ok: false, provider: config.provider, url: endpoint.url, model: endpoint.model, error: '未配置 AI_API_KEY' }
  }

  const body = JSON.stringify({
    model: endpoint.model,
    messages: [{ role: 'user', content: '请回复"连通性测试成功"四个字。' }],
    temperature: 0,
    max_tokens: 32,
  })

  try {
    const text = await httpPost(endpoint.url, { Authorization: `Bearer ${config.apiKey}` }, body)
    const json = JSON.parse(text)
    const sample = json?.choices?.[0]?.message?.content || ''
    return { ok: !!sample, provider: config.provider, url: endpoint.url, model: endpoint.model, sample }
  } catch (e: any) {
    return { ok: false, provider: config.provider, url: endpoint.url, model: endpoint.model, error: e?.message || String(e) }
  }
}

export async function generateArticle(
  prompt: string,
  knowledgeContent?: string,
  distillWord?: string
): Promise<string> {
  const config = getConfig()
  if (!config.apiKey) {
    return generateFallbackArticle(prompt, distillWord)
  }

  const endpoint = getEndpoint(config)

  let systemPrompt = '你是一个专业的SEO文章写手。请根据用户提供的指令生成高质量的文章。'
  if (knowledgeContent) {
    systemPrompt += `\n\n企业背景信息：\n${knowledgeContent}`
  }
  if (distillWord) {
    systemPrompt += `\n\n文章需要自然融入关键词"${distillWord}"，不要生硬堆砌。`
  }

  const requestBody = JSON.stringify({
    model: endpoint.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  })

  try {
    const responseText = await httpPost(endpoint.url, {
      Authorization: `Bearer ${config.apiKey}`,
    }, requestBody)

    const response = JSON.parse(responseText)
    return response.choices?.[0]?.message?.content || generateFallbackArticle(prompt, distillWord)
  } catch (err: any) {
    console.error('AI API call failed:', err.message)
    return generateFallbackArticle(prompt, distillWord)
  }
}

function generateFallbackArticle(prompt: string, distillWord?: string): string {
  const keyword = distillWord || '相关领域'
  const title = `关于${keyword}的深度分析`
  return `# ${title}

在当今快速发展的时代，${keyword}已经成为越来越多人关注的焦点。本文将从多个角度为您详细解析${keyword}的相关信息。

## 一、${keyword}的基本概述

${keyword}作为一个重要的领域，近年来得到了广泛的关注和发展。无论是从行业趋势还是市场需求来看，${keyword}都展现出了巨大的潜力和价值。

## 二、${keyword}的核心优势

选择${keyword}的原因有很多，首先是其在市场中的竞争力不断增强，其次是越来越多的专业人士投入到这个领域中来，推动了整个行业的快速发展。

## 三、如何更好地了解${keyword}

对于想要深入了解${keyword}的读者，建议从以下几个方面入手：
1. 关注行业最新动态和趋势报告
2. 参考专业机构的研究成果
3. 与业内人士交流学习

## 总结

综上所述，${keyword}是一个值得深入研究和关注的领域。希望本文能够为您提供有价值的参考信息。

*本文由AI辅助生成，基于指令: ${prompt.substring(0, 50)}...*`
}
