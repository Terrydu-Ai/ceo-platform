import { NextRequest, NextResponse } from 'next/server'
import { runNewsFetch } from '@/lib/news-service'
import { BUSINESSES, type Business } from '@/types/news'

// Hobby plan caps function execution at 60s. We split the cron into per-channel
// invocations (see vercel.json) so a single run never approaches this limit.
export const maxDuration = 60

// This route is for Vercel Cron jobs (which send GET with an x-vercel-cron header)
// and for manual curl testing via CRON_SECRET. The dashboard button uses a
// Server Action instead (app/actions.ts).
//
// Optional `?business=` query (comma-separated) limits the run to those channels,
// e.g. /api/fetch-news?business=ceo or ?business=djj,likehome,ele.
// Omitting it runs every channel.
async function handle(request: NextRequest) {
  // Vercel sets this header on all cron requests
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  // Also allow a manual override via CRON_SECRET for curl testing
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const param = new URL(request.url).searchParams.get('business')
  let businesses: Business[] | undefined
  if (param) {
    const valid = new Set<string>(BUSINESSES)
    businesses = param
      .split(',')
      .map((s) => s.trim())
      .filter((s) => valid.has(s)) as Business[]
    if (businesses.length === 0) {
      return NextResponse.json({ error: 'Invalid business param' }, { status: 400 })
    }
  }

  try {
    const result = businesses ? await runNewsFetch(businesses) : await runNewsFetch()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
