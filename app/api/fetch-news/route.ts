import { NextRequest, NextResponse } from 'next/server'
import { runNewsFetch } from '@/lib/news-service'

// This route is only for Vercel Cron jobs.
// The dashboard button uses a Server Action instead (app/actions.ts).
export async function POST(request: NextRequest) {
  // Vercel sets this header on all cron requests
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  // Also allow a manual override via CRON_SECRET for curl testing
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runNewsFetch()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
