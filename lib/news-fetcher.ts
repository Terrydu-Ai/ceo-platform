import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'CEO-Platform-NewsBot/1.0' },
})

interface RawArticle {
  title: string
  link: string
  content: string
  source: string
  publishedAt: Date
}

interface FeedSource {
  url: string
  source: string
  // Chinese sources need longer cutoff since they post less frequently
  cutoffHours?: number
}

const RSS_SOURCES: FeedSource[] = [
  // English AI News
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
  { url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge' },
  { url: 'https://openai.com/blog/rss.xml', source: 'OpenAI Blog' },
  { url: 'https://www.anthropic.com/rss.xml', source: 'Anthropic' },
  { url: 'https://huggingface.co/blog/feed.xml', source: 'HuggingFace' },
  { url: 'https://deepmind.google/blog/rss/', source: 'Google DeepMind' },
  // Chinese AI News — use 72h cutoff to compensate for lower post frequency
  { url: 'https://www.qbitai.com/feed', source: '量子位', cutoffHours: 72 },
  { url: 'https://www.leiphone.com/feed', source: '雷峰网', cutoffHours: 72 },
  { url: 'https://www.ifanr.com/feed', source: '爱范儿', cutoffHours: 72 },
]

export async function fetchAllFeeds(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map((src) => fetchFeed(src.url, src.source, src.cutoffHours ?? 48))
  )

  const articles: RawArticle[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value)
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  return articles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false
    seen.add(a.link)
    return true
  })
}

async function fetchFeed(url: string, source: string, cutoffHours: number): Promise<RawArticle[]> {
  const cutoff = new Date(Date.now() - cutoffHours * 60 * 60 * 1000)
  const feed = await parser.parseURL(url)
  return (feed.items || [])
    .slice(0, 20)
    .map((item) => ({
      title: item.title || '',
      link: item.link || '',
      content: item.contentSnippet || item.content || item.summary || '',
      source,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    }))
    .filter((a) => a.publishedAt >= cutoff)
}

export type { RawArticle }
