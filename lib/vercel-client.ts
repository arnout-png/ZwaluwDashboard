const VERCEL_API = 'https://api.vercel.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function teamParam(prefix = '?') {
  const tid = process.env.VERCEL_TEAM_ID
  return tid ? `${prefix}teamId=${tid}` : ''
}

export type VercelDeployment = {
  id: string
  url: string
  state: string
  createdAt: number
}

export async function getDeployments(projectId: string): Promise<VercelDeployment[]> {
  try {
    const team = process.env.VERCEL_TEAM_ID
    const qs = team
      ? `?projectId=${projectId}&limit=10&teamId=${team}`
      : `?projectId=${projectId}&limit=10`
    const res = await fetch(`${VERCEL_API}/v6/deployments${qs}`, {
      headers: headers(),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.deployments ?? []).map((d: any) => ({
      id: d.uid as string,
      url: d.url as string,
      state: d.readyState as string,
      createdAt: d.createdAt as number,
    }))
  } catch {
    return []
  }
}

export async function getProjectInfo(projectId: string) {
  try {
    const res = await fetch(`${VERCEL_API}/v9/projects/${projectId}${teamParam()}`, {
      headers: headers(),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
