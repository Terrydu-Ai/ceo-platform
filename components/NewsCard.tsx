import type { NewsArticle } from '@/types/news'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const CATEGORY_STYLES: Record<string, string> = {
  '模型发布': 'bg-blue-50 text-blue-700 ring-blue-200',
  '行业动态': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  '商业应用': 'bg-amber-50 text-amber-700 ring-amber-200',
  '中国AI': 'bg-rose-50 text-rose-700 ring-rose-200',
}

const SOURCE_ICONS: Record<string, string> = {
  'TechCrunch': '📰',
  'VentureBeat': '💼',
  'The Verge': '🔷',
  'OpenAI Blog': '🤖',
  'Anthropic': '🧠',
  'HuggingFace': '🤗',
  'Google DeepMind': '🔬',
  '机器之心': '⚡',
  '36氪': '🚀',
}

interface NewsCardProps {
  article: NewsArticle
}

export default function NewsCard({ article }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: zhCN,
  })

  const categoryStyle = CATEGORY_STYLES[article.category] || 'bg-gray-50 text-gray-700 ring-gray-200'
  const sourceIcon = SOURCE_ICONS[article.source] || '📄'

  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset flex-shrink-0 ${categoryStyle}`}
        >
          {article.category}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</span>
      </div>

      <h2 className="text-[15px] font-semibold text-gray-900 mb-1.5 leading-snug line-clamp-2">
        {article.title_zh || article.title}
      </h2>

      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {article.summary_zh}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>{sourceIcon}</span>
          <span className="font-medium">{article.source}</span>
        </div>
        <a
          href={article.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          原文
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </article>
  )
}
