'use server'

import { runNewsFetch } from '@/lib/news-service'
import type { FetchNewsResult } from '@/types/news'

export async function fetchNewsAction(): Promise<FetchNewsResult & { error?: string }> {
  try {
    return await runNewsFetch()
  } catch (err) {
    return {
      inserted: 0,
      skipped: 0,
      errors: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
