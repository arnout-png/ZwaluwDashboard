const GITHUB_API = 'https://api.github.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ZwaluwDashboard/1.0',
  }
}

export type GithubCommit = {
  sha: string
  message: string
  author: string
  date: string
}

export type Languages = Record<string, number>

export async function getCommits(
  owner: string,
  repo: string,
  since: Date
): Promise<GithubCommit[]> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/commits?since=${since.toISOString()}&per_page=100`
    const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((c: any) => ({
      sha: c.sha as string,
      message: (c.commit?.message as string ?? '').split('\n')[0],
      author: c.commit?.author?.name as string ?? 'unknown',
      date: c.commit?.author?.date as string ?? '',
    }))
  } catch {
    return []
  }
}

export async function getLanguages(owner: string, repo: string): Promise<Languages> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/languages`
    const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

export async function getRepoInfo(owner: string, repo: string) {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}`
    const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
