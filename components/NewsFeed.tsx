'use client'

import { useState, useEffect, useCallback } from 'react'
import type { NewsArticle, NewsCategory } from '@/types/news'
import NewsCard from './NewsCard'
import CategoryFilter from './CategoryFilter'
import Header from './Header'

type FilterCategory = 'all' | NewsCategory

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-4 w-14 bg-gray-100 rounded" />
      </div>
      <div className="h-4 bg-gray-100 rounded mb-2 w-4/5" />
      <div className="h-4 bg-gray-100 rounded mb-4 w-3/5" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )
}

export default function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/news?limit=100')
      const data = await res.json()
      setArticles(data.articles || [])
      setLastUpdated(new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === activeCategory)

  const counts: Record<string, number> = {}
  for (const a of articles) {
    counts[a.category] = (counts[a.category] || 0) + 1
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onRefresh={fetchArticles} isRefreshing={loading} lastUpdated={lastUpdated} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter
            active={activeCategory}
            onChange={setActiveCategory}
            counts={counts}
          />
        </div>

        {/* Stats Bar */}
        {!loading && articles.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">
              显示 <span className="font-semibold text-gray-900">{filtered.length}</span> 条新闻
              {activeCategory !== 'all' && (
                <span className="text-gray-400"> · {activeCategory}</span>
              )}
            </span>
          </div>
        )}

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">暂无新闻</p>
            <p className="text-sm text-gray-400 mt-1">点击「抓取新闻」获取最新 AI 资讯</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
