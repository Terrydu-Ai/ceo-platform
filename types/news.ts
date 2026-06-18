export type NewsCategory = '模型发布' | '行业动态' | '商业应用' | '中国AI'

// Business channels. 'ceo' = the original general AI news (unchanged).
export type Business = 'ceo' | 'djj' | 'likehome' | 'ele'

export const BUSINESSES: Business[] = ['ceo', 'djj', 'likehome', 'ele']

export interface NewsArticle {
  id: string
  title: string
  title_zh: string
  summary_zh: string
  original_url: string
  source: string
  business: Business
  // CEO channel uses NewsCategory; business channels use their own
  // sub-categories, so this is a plain string at the storage layer.
  category: string
  published_at: string
  created_at: string
  image_url?: string | null
}

export interface FetchNewsResult {
  inserted: number
  skipped: number
  errors: number
  // Optional per-business breakdown when a multi-channel run is performed
  byBusiness?: Record<string, { inserted: number; skipped: number; errors: number }>
}
