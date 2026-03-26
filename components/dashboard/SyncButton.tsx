'use client'

import { RefreshCw } from 'lucide-react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { triggerSync } from '@/app/actions'

export function SyncButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await triggerSync()
          router.refresh()
        })
      }
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Syncing...' : 'Sync'}
    </button>
  )
}
