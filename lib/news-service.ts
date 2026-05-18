import { fetchAllFeeds } from './news-fetcher'
import { processBatch } from './claude-processor'
import { getSupabaseAdmin } from './supabase'
import type { FetchNewsResult } from '@/types/news'

export async function runNewsFetch(): Promise<FetchNewsResult> {
  let inserted = 0
  let skipped = 0
  let errors = 0

  const db = getSupabaseAdmin()
  const rawArticles = await fetchAllFeeds()
  if (rawArticles.length === 0) return { inserted, skipped, errors }

  const urls = rawArticles.map((a) => a.link).filter(Boolean)
  const { data: existing } = await db
    .from('news_articles')
    .select('original_url')
    .in('original_url', urls)

  const existingUrls = new Set((existing || []).map((r: { original_url: string }) => r.original_url))
  const newArticles = rawArticles.filter((a) => a.link && !existingUrls.has(a.link))
  skipped = rawArticles.length - newArticles.length

  if (newArticles.length === 0) return { inserted, skipped, errors }

  const processed = await processBatch(newArticles)

  const rows = processed.map(({ article, processed: p }) => ({
    title: article.title,
    title_zh: p.title_zh,
    summary_zh: p.summary_zh,
    original_url: article.link,
    source: article.source,
    category: p.category,
    published_at: article.publishedAt.toISOString(),
  }))

  if (rows.length > 0) {
    const { error } = await db
      .from('news_articles')
      .insert(rows)
    if (error) {
      errors = rows.length
    } else {
      inserted = rows.length
    }
  }

  return { inserted, skipped, errors }
}
