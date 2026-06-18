import Anthropic from '@anthropic-ai/sdk'
import type { RawArticle } from './news-fetcher'
import type { Business } from '@/types/news'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ProcessedArticle {
  title_zh: string
  summary_zh: string
  category: string
  relevant: boolean
}

// CEO channel categories (unchanged)
const CEO_CATEGORIES = ['模型发布', '行业动态', '商业应用', '中国AI']

// Per-business sub-categories. business is assigned by the source (not inferred
// by the model); the model only gates relevance, translates, and sub-classifies.
export const BUSINESS_CATEGORIES: Record<Exclude<Business, 'ceo'>, string[]> = {
  djj: ['行业动态', '竞品动向', '关税政策', '仓储物流', '技术产品'],
  likehome: ['房产市场', '法规变化', '收益趋势', '竞品平台'],
  ele: ['设计趋势', '家居零售', '市场数据', 'Staging'],
}

const BUSINESS_CONTEXT: Record<Exclude<Business, 'ceo'>, string> = {
  djj: '叉车与物料搬运/仓储物流行业情报（服务一家叉车经销商，关注杭叉 Hangcha 及竞品、仓储自动化、澳洲机械进口关税、NSW 仓储租金）',
  likehome: '澳洲（尤其悉尼/NSW）房产与短租市场情报（关注 Airbnb/短租法规、租赁法改革、入住率与收益趋势）',
  ele: '家具与室内设计/家居零售情报（关注澳洲家居市场、设计趋势、房产 staging/styling）',
}

// Sources that are Chinese media — articles from these default to "中国AI" when relevant
const CHINESE_SOURCES = new Set(['量子位', '雷峰网', '爱范儿', '机器之心', '36氪'])

export async function processArticle(
  article: RawArticle,
  business: Business = 'ceo'
): Promise<ProcessedArticle | null> {
  return business === 'ceo'
    ? processCeoArticle(article)
    : processBusinessArticle(article, business)
}

// ─── CEO channel: original behaviour, verbatim ───
async function processCeoArticle(article: RawArticle): Promise<ProcessedArticle | null> {
  const isChineseSource = CHINESE_SOURCES.has(article.source)

  try {
    const prompt = `你是一个AI行业新闻分析师。请分析以下新闻并返回JSON格式结果。

新闻标题：${article.title}
新闻来源：${article.source}（${isChineseSource ? '中文媒体' : '英文媒体'}）
新闻内容摘要：${article.content.slice(0, 800)}

请返回以下JSON格式（不要有任何其他文字）：
{
  "relevant": true/false,
  "title_zh": "中文标题（若已是中文则保持原文，英文则翻译）",
  "summary_zh": "3-4句话的中文摘要，概括核心要点",
  "category": "模型发布" | "行业动态" | "商业应用" | "中国AI"
}

分类规则：
- 模型发布：新AI模型发布、重大技术突破、benchmark评测
- 行业动态：公司战略、人事变动、政策法规、学术研究进展
- 商业应用：企业落地AI、融资收购、AI产品商业化
- 中国AI：凡涉及中国公司（百度、阿里、腾讯、华为、字节、DeepSeek、Kimi等）、中国政策、中国AI生态的新闻，无论来源是中文还是英文媒体，均归此类

重要：来源为「${article.source}」${isChineseSource ? '（中文媒体），若内容与AI/科技相关，优先归类为"中国AI"' : ''}
与AI或科技无关的内容请标记 relevant: false`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const result = JSON.parse(jsonMatch[0])
    if (!result.relevant || !CEO_CATEGORIES.includes(result.category)) return null

    return {
      title_zh: result.title_zh || article.title,
      summary_zh: result.summary_zh || '',
      category: result.category,
      relevant: true,
    }
  } catch {
    return null
  }
}

// ─── Business channels: relevance gate + translate + sub-classify ───
async function processBusinessArticle(
  article: RawArticle,
  business: Exclude<Business, 'ceo'>
): Promise<ProcessedArticle | null> {
  const categories = BUSINESS_CATEGORIES[business]
  const context = BUSINESS_CONTEXT[business]

  try {
    const prompt = `你是一个行业情报分析师，负责筛选与「${context}」相关的新闻。请分析以下新闻并返回JSON格式结果。

新闻标题：${article.title}
新闻来源：${article.source}
新闻内容摘要：${article.content.slice(0, 800)}

请返回以下JSON格式（不要有任何其他文字）：
{
  "relevant": true/false,
  "title_zh": "中文标题（若已是中文则保持原文，英文则翻译）",
  "summary_zh": "3-4句话的中文摘要，突出对该业务的情报价值",
  "category": ${categories.map((c) => `"${c}"`).join(' | ')}
}

分类只能从以上选项中选一个最贴切的。
与「${context}」无关、或纯属泛泛广告/招聘/无信息量的内容，请标记 relevant: false。`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const result = JSON.parse(jsonMatch[0])
    if (!result.relevant || !categories.includes(result.category)) return null

    return {
      title_zh: result.title_zh || article.title,
      summary_zh: result.summary_zh || '',
      category: result.category,
      relevant: true,
    }
  } catch {
    return null
  }
}

export async function processBatch(
  articles: RawArticle[],
  business: Business = 'ceo'
): Promise<Array<{ article: RawArticle; processed: ProcessedArticle }>> {
  const results: Array<{ article: RawArticle; processed: ProcessedArticle }> = []

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < articles.length; i += 5) {
    const batch = articles.slice(i, i + 5)
    const batchResults = await Promise.allSettled(
      batch.map(async (article) => {
        const processed = await processArticle(article, business)
        return processed ? { article, processed } : null
      })
    )
    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) {
        results.push(r.value)
      }
    }
    // Small delay between batches
    if (i + 5 < articles.length) {
      await new Promise((res) => setTimeout(res, 1000))
    }
  }

  return results
}
