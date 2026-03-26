// Supabase Management API client.
// Requires SUPABASE_MGMT_TOKEN env var (org-level access token from supabase.com/account/tokens).
// If token is not set, all functions return null gracefully.

const MGMT_API = 'https://api.supabase.com/v1'

function mgmtHeaders() {
  return {
    Authorization: `Bearer ${process.env.SUPABASE_MGMT_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export type SupabaseProjectHealth = {
  ref: string
  dbSizeMb: number | null
  activeConnections: number | null
}

export async function getSupabaseHealth(ref: string): Promise<SupabaseProjectHealth | null> {
  try {
    const token = process.env.SUPABASE_MGMT_TOKEN
    if (!token) return null

    // Try the usage/metrics endpoint
    const res = await fetch(`${MGMT_API}/projects/${ref}/database/query`, {
      method: 'POST',
      headers: mgmtHeaders(),
      body: JSON.stringify({
        query: `
          SELECT
            pg_database_size(current_database()) / 1024.0 / 1024.0 AS db_size_mb,
            count(*) AS active_connections
          FROM pg_stat_activity
          WHERE state = 'active';
        `,
      }),
    })

    if (!res.ok) return { ref, dbSizeMb: null, activeConnections: null }

    const data = await res.json()
    const row = data?.data?.[0] ?? {}
    return {
      ref,
      dbSizeMb: row.db_size_mb != null ? Math.round(row.db_size_mb * 10) / 10 : null,
      activeConnections: row.active_connections != null ? parseInt(row.active_connections) : null,
    }
  } catch {
    return null
  }
}

// Map of project_id → supabase ref
export const SUPABASE_REFS: Record<string, string> = {
  'zwaluw-portal':   'oygbjxzpwnuyxgycofil',
  'callflow':        'omynoptrdgqwhlotbhzf',
  'zwaluwplanner':   'vsebuetvbdfsqidrhtcn',
  'zwaluw-dashboard':'iuqkxkaijlejkmluqvvv',
}
