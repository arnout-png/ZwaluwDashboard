import { NextRequest, NextResponse } from 'next/server'
import { syncAll, syncProject } from '@/lib/sync'

// Triggered by Vercel Cron (nightly 02:00) and manual sync button
export async function GET(req: NextRequest) {
  // Verify cron secret (skip check if not configured)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    await syncAll()
    return NextResponse.json({ ok: true, synced: true })
  } catch (err) {
    console.error('Sync failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Single-project sync via POST /api/sync  body: { projectId }
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    await syncProject(projectId)
    return NextResponse.json({ ok: true, projectId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
