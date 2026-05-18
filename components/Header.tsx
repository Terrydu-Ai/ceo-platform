'use client'

import { useState } from 'react'
import { fetchNewsAction } from '@/app/actions'

interface HeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated: string | null
}

export default function Header({ onRefresh, isRefreshing, lastUpdated }: HeaderProps) {
  const [isFetching, setIsFetching] = useState(false)

  const handleFetchNews = async () => {
    setIsFetching(true)
    try {
      const result = await fetchNewsAction()
      if (result.error) {
        alert(`抓取失败：${result.error}`)
      } else {
        alert(`抓取完成：新增 ${result.inserted} 条，跳过 ${result.skipped} 条`)
        onRefresh()
      }
    } finally {
      setIsFetching(false)
    }
  }

  const now = new Date()
  const greeting =
    now.getHours() < 12 ? '早上好' : now.getHours() < 18 ? '下午好' : '晚上好'
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI 新闻简报</h1>
                <p className="text-xs text-gray-400">{greeting}，{dateStr}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:block">
                更新于 {new Date(lastUpdated).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              刷新
            </button>
            <button
              onClick={handleFetchNews}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isFetching ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  抓取中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  抓取新闻
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
