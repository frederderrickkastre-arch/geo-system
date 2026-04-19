import { aiFetch } from './aiClient'
import { logger } from './logger'

export interface AIConfig {
  provider: 'deepseek' | 'qianwen' | 'wenxin'
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

function getEndpoint(config: AIConfig): { url: string; model: string } {
  switch (config.provider) {
    case 'deepseek':
      return {
        url: config.baseUrl || 'https://api.deepseek.com/v1/chat/completions',
        model: config.model || 'deepseek-chat',
      }
    case 'qianwen':
      return {
        url: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: config.model || 'qwen-turbo',
      }
    case 'wenxin':
      return {
        url:
          config.baseUrl ||
          'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
        model: config.model || 'ernie-bot',
      }
    default:
      return {
        url: config.baseUrl || 'https://api.deepseek.com/v1/chat/completions',
        model: config.model || 'deepseek-chat',
      }
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

  const result = await aiFetch(endpoint.url, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: requestBody,
  })

  if (!result.ok) {
    logger.warn({ status: result.status }, 'AI call failed, falling back to template')
    return generateFallbackArticle(prompt, distillWord)
  }

  try {
    const response = JSON.parse(result.body)
    return response.choices?.[0]?.message?.content || generateFallbackArticle(prompt, distillWord)
  } catch (err) {
    logger.warn({ err }, 'AI response parse failed, falling back to template')
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
