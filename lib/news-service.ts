import { fetchFeedsForBusiness } from './news-fetcher'
import { processBatch } from './claude-processor'
import { getSupabaseAdmin } from './supabase'
import { BUSINESSES, type Business, type FetchNewsResult } from '@/types/news'
import type { SupabaseClient } from '@supabase/supabase-js'

type Counts = { inserted: number; skipped: number; errors: number }

// Fetch + process + store news for the given business channels.
// Defaults to every channel (CEO + all business channels), which is what the
// cron job and dashboard refresh button use.
export async function runNewsFetch(
  businesses: Business[] = BUSINESSES
): Promise<FetchNewsResult> {
  const db = getSupabaseAdmin()
  const total: Counts = { inserted: 0, skipped: 0, errors: 0 }
  const byBusiness: Record<string, Counts> = {}

  for (const business of businesses) {
    const counts = await runForBusiness(db, business)
    byBusiness[business] = counts
    total.inserted += counts.inserted
    total.skipped += counts.skipped
    total.errors += counts.errors
  }

  return { ...total, byBusiness }
}

async function runForBusiness(db: SupabaseClient, business: Business): Promise<Counts> {
  const counts: Counts = { inserted: 0, skipped: 0, errors: 0 }

  const rawArticles = await fetchFeedsForBusiness(business)
  if (rawArticles.length === 0) return counts

  const urls = rawArticles.map((a) => a.link).filter(Boolean)
  const { data: existing } = await db
    .from('news_articles')
    .select('original_url')
    .in('original_url', urls)

  const existingUrls = new Set((existing || []).map((r: { original_url: string }) => r.original_url))
  const newArticles = rawArticles.filter((a) => a.link && !existingUrls.has(a.link))
  counts.skipped = rawArticles.length - newArticles.length

  if (newArticles.length === 0) return counts

  const processed = await processBatch(newArticles, business)

  const rows = processed.map(({ article, processed: p }) => ({
    title: article.title,
    title_zh: p.title_zh,
    summary_zh: p.summary_zh,
    original_url: article.link,
    source: article.source,
    business,
    category: p.category,
    published_at: article.publishedAt.toISOString(),
  }))

  if (rows.length > 0) {
    const { error } = await db.from('news_articles').insert(rows)
    if (error) {
      counts.errors = rows.length
    } else {
      counts.inserted = rows.length
    }
  }

  return counts
}
