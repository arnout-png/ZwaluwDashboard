'use server'

import { syncAll } from '@/lib/sync'

export async function triggerSync() {
  try {
    await syncAll()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
