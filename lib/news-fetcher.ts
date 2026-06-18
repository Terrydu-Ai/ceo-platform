import Parser from 'rss-parser'
import type { Business } from '@/types/news'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'CEO-Platform-NewsBot/1.0' },
})

interface RawArticle {
  title: string
  link: string
  content: string
  source: string
  business: Business
  publishedAt: Date
}

interface FeedSource {
  url: string
  source: string
  business: Business
  // Chinese / niche sources need a longer cutoff since they post less frequently
  cutoffHours?: number
  // Google News search feeds embed the publisher in the title (" - Publisher")
  googleNews?: boolean
}

// Build a Google News RSS feed for a search query, localised to Australia.
function gnews(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-AU&gl=AU&ceid=AU:en`
}

function querySources(queries: string[], business: Business, cutoffHours = 168): FeedSource[] {
  return queries.map((q) => ({
    url: gnews(q),
    source: 'Google News',
    business,
    cutoffHours,
    googleNews: true,
  }))
}

// ─── CEO channel: original general AI news (behaviour unchanged) ───
const CEO_SOURCES: FeedSource[] = [
  // English AI News
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', business: 'ceo' },
  { url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat', business: 'ceo' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge', business: 'ceo' },
  { url: 'https://openai.com/blog/rss.xml', source: 'OpenAI Blog', business: 'ceo' },
  { url: 'https://www.anthropic.com/rss.xml', source: 'Anthropic', business: 'ceo' },
  { url: 'https://huggingface.co/blog/feed.xml', source: 'HuggingFace', business: 'ceo' },
  { url: 'https://deepmind.google/blog/rss/', source: 'Google DeepMind', business: 'ceo' },
  // Chinese AI News — use 72h cutoff to compensate for lower post frequency
  { url: 'https://www.qbitai.com/feed', source: '量子位', business: 'ceo', cutoffHours: 72 },
  { url: 'https://www.leiphone.com/feed', source: '雷峰网', business: 'ceo', cutoffHours: 72 },
  { url: 'https://www.ifanr.com/feed', source: '爱范儿', business: 'ceo', cutoffHours: 72 },
]

// ─── Business channels: Google News query feeds (localised AU) ───
const DJJ_QUERIES = [
  'forklift industry',
  'material handling equipment',
  'Hangcha',
  'Linde forklift OR Toyota material handling',
  'warehouse automation Australia',
  'Australia import tariff machinery',
  'NSW warehouse rent OR industrial rent',
  'lithium forklift OR electric forklift',
  'forklift Australia',
]

const LIKEHOME_QUERIES = [
  'Sydney property market',
  'NSW short-term rental regulation',
  'Airbnb Australia regulation',
  'Sydney rental market',
  'short-term rental occupancy Australia',
  'NSW tenancy law OR rental law reform',
  'property management Australia',
]

const ELE_QUERIES = [
  'furniture retail Australia',
  'interior design trends 2026',
  'home staging',
  'Australian homewares market',
  'property styling Australia',
  'designer furniture Australia',
]

const BUSINESS_SOURCES: Record<Business, FeedSource[]> = {
  ceo: CEO_SOURCES,
  djj: querySources(DJJ_QUERIES, 'djj'),
  likehome: querySources(LIKEHOME_QUERIES, 'likehome'),
  ele: querySources(ELE_QUERIES, 'ele'),
}

// Fetch + dedup all feeds for a single business channel.
export async function fetchFeedsForBusiness(business: Business): Promise<RawArticle[]> {
  return fetchSources(BUSINESS_SOURCES[business])
}

async function fetchSources(sources: FeedSource[]): Promise<RawArticle[]> {
  const results = await Promise.allSettled(sources.map((s) => fetchFeed(s)))

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

async function fetchFeed(src: FeedSource): Promise<RawArticle[]> {
  const cutoffHours = src.cutoffHours ?? 48
  const cutoff = new Date(Date.now() - cutoffHours * 60 * 60 * 1000)
  const feed = await parser.parseURL(src.url)
  return (feed.items || [])
    .slice(0, 20)
    .map((item) => {
      let title = item.title || ''
      let source = src.source
      // Google News titles look like "Headline - Publisher"; split off the publisher.
      if (src.googleNews) {
        const idx = title.lastIndexOf(' - ')
        if (idx > 0) {
          source = title.slice(idx + 3).trim() || src.source
          title = title.slice(0, idx).trim()
        }
      }
      return {
        title,
        link: item.link || '',
        content: item.contentSnippet || item.content || item.summary || '',
        source,
        business: src.business,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }
    })
    .filter((a) => a.publishedAt >= cutoff)
}

export type { RawArticle }
