'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { triggerSync } from '@/app/actions'

const SYNC_STEPS = [
  'Projecten laden...',
  'Commits ophalen...',
  'Commit details ophalen...',
  'Metrics berekenen...',
  'AI analyses genereren...',
  'Infrastructuur syncing...',
  'Afronden...',
]

export function SyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [step, setStep] = useState(0)
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    setStep(0)

    // Simulate progress while sync runs
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, SYNC_STEPS.length - 1))
    }, 4000)

    try {
      await triggerSync()
    } finally {
      clearInterval(interval)
      setSyncing(false)
      setStep(0)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-3">
      {syncing && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-1000 ease-out"
              style={{ width: `${((step + 1) / SYNC_STEPS.length) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-500 whitespace-nowrap">{SYNC_STEPS[step]}</span>
        </div>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync'}
      </button>
    </div>
  )
}
