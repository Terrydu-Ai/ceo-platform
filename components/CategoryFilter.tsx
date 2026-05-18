'use client'

import type { NewsCategory } from '@/types/news'

type FilterCategory = 'all' | NewsCategory

interface CategoryFilterProps {
  active: FilterCategory
  onChange: (cat: FilterCategory) => void
  counts: Record<string, number>
}

const CATEGORIES: { key: FilterCategory; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: 'bg-gray-900 text-white' },
  { key: '模型发布', label: '模型发布', color: 'bg-blue-600 text-white' },
  { key: '行业动态', label: '行业动态', color: 'bg-emerald-600 text-white' },
  { key: '商业应用', label: '商业应用', color: 'bg-amber-500 text-white' },
  { key: '中国AI', label: '中国 AI', color: 'bg-rose-600 text-white' },
]

export default function CategoryFilter({ active, onChange, counts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const count = cat.key === 'all'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[cat.key] || 0
        const isActive = active === cat.key

        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive
                ? cat.color
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
