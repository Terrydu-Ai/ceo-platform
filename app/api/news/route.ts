import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  // business dimension: defaults to 'ceo' so the existing dashboard (which
  // queries without a business param) keeps showing only general AI news.
  const business = searchParams.get('business') || 'ceo'
  const limit = parseInt(searchParams.get('limit') || '50')

  const db = getSupabase()
  let query = db
    .from('news_articles')
    .select('*')
    .eq('business', business)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ articles: data || [] })
}
