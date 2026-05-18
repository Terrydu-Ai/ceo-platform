export type NewsCategory = '模型发布' | '行业动态' | '商业应用' | '中国AI'

export interface NewsArticle {
  id: string
  title: string
  title_zh: string
  summary_zh: string
  original_url: string
  source: string
  category: NewsCategory
  published_at: string
  created_at: string
  image_url?: string | null
}

export interface FetchNewsResult {
  inserted: number
  skipped: number
  errors: number
}
