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

export type WeeklyCodeFrequency = {
  weekStart: string // ISO date string
  additions: number
  deletions: number
}

export async function getCodeFrequency(
  owner: string,
  repo: string
): Promise<WeeklyCodeFrequency[]> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/stats/code_frequency`
    const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((row: [number, number, number]) => ({
      weekStart: new Date(row[0] * 1000).toISOString().slice(0, 10),
      additions: row[1],
      deletions: Math.abs(row[2]),
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

export type GithubPR = {
  number: number
  title: string
  state: 'open' | 'closed'
  author: string
  baseBranch: string
  headBranch: string
  createdAt: string
  mergedAt: string | null
  url: string
}

export type GithubIssue = {
  number: number
  title: string
  state: 'open' | 'closed'
  author: string
  labels: string[]
  createdAt: string
  closedAt: string | null
  url: string
}

export type GithubBranch = {
  name: string
  isDefault: boolean
  lastCommitSha: string
  lastCommitDate: string
}

export async function getPullRequests(
  owner: string,
  repo: string,
  state: 'open' | 'all' = 'open'
): Promise<GithubPR[]> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&per_page=50`
    const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((pr: any) => ({
      number: pr.number as number,
      title: pr.title as string ?? '',
      state: pr.state as 'open' | 'closed',
      author: pr.user?.login as string ?? 'unknown',
      baseBranch: pr.base?.ref as string ?? '',
      headBranch: pr.head?.ref as string ?? '',
      createdAt: pr.created_at as string ?? '',
      mergedAt: pr.merged_at as string | null ?? null,
      url: pr.html_url as string ?? '',
    }))
  } catch {
    return []
  }
}

export async function getIssues(
  owner: string,
  repo: string,
  state: 'open' | 'all' = 'open'
): Promise<GithubIssue[]> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=${state}&per_page=50`
    const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    // GitHub issues endpoint also returns PRs — filter them out
    return data
      .filter((item: any) => !item.pull_request)
      .map((issue: any) => ({
        number: issue.number as number,
        title: issue.title as string ?? '',
        state: issue.state as 'open' | 'closed',
        author: issue.user?.login as string ?? 'unknown',
        labels: (issue.labels ?? []).map((l: any) => l.name as string),
        createdAt: issue.created_at as string ?? '',
        closedAt: issue.closed_at as string | null ?? null,
        url: issue.html_url as string ?? '',
      }))
  } catch {
    return []
  }
}

export async function getBranches(owner: string, repo: string): Promise<GithubBranch[]> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/branches?per_page=100`
    const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []

    // Also fetch default branch from repo info
    const info = await getRepoInfo(owner, repo)
    const defaultBranch = info?.default_branch ?? 'main'

    return data.map((b: any) => ({
      name: b.name as string,
      isDefault: b.name === defaultBranch,
      lastCommitSha: b.commit?.sha as string ?? '',
      lastCommitDate: b.commit?.commit?.author?.date as string ?? '',
    }))
  } catch {
    return []
  }
}
