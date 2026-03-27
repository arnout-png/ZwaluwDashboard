/**
 * Project Metrics — pure computation functions (no AI, no DB)
 */

export type CodeVelocityWeek = {
  weekStart: string
  additions: number
  deletions: number
  net: number
}

export type ProjectMetrics = {
  codeVelocityWeekly: CodeVelocityWeek[]
  commitConsistencyScore: number  // 0–100
  deploySuccessRate: number       // 0–1
  avgBuildTimeMs: number
  activeContributors: number
  codeChurnRate: number           // 0–1
  avgCommitSize: number           // lines per commit
}

/** Code velocity: lines added/removed per week */
export function computeCodeVelocity(
  codeFrequency: Array<{ weekStart: string; additions: number; deletions: number }>
): CodeVelocityWeek[] {
  return codeFrequency.map((w) => ({
    weekStart: w.weekStart,
    additions: w.additions,
    deletions: w.deletions,
    net: w.additions - w.deletions,
  }))
}

/**
 * Commit consistency: how regular are commits?
 * Low std dev = high consistency. Score 0–100.
 */
export function computeCommitConsistency(
  commits: Array<{ committed_at: string }>,
  days: number
): number {
  if (commits.length === 0) return 0

  // Count commits per day
  const dailyCounts: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    dailyCounts[d] = 0
  }
  for (const c of commits) {
    const day = c.committed_at.slice(0, 10)
    if (dailyCounts[day] !== undefined) dailyCounts[day]++
  }

  const values = Object.values(dailyCounts)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0

  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Coefficient of variation: lower = more consistent
  const cv = stdDev / mean
  // Map CV to score: CV=0 → 100, CV=2+ → 10
  return Math.round(Math.max(10, Math.min(100, 100 - cv * 40)))
}

/** Deploy success rate: READY / total */
export function computeDeploySuccessRate(
  deployments: Array<{ state: string }>
): number {
  if (deployments.length === 0) return 0
  return deployments.filter((d) => d.state === 'READY').length / deployments.length
}

/** Average build time from deployments with build_duration_ms */
export function computeAvgBuildTime(
  deployments: Array<{ build_duration_ms?: number | null }>
): number {
  const withBuild = deployments.filter((d) => d.build_duration_ms && d.build_duration_ms > 0)
  if (withBuild.length === 0) return 0
  return Math.round(
    withBuild.reduce((s, d) => s + (d.build_duration_ms ?? 0), 0) / withBuild.length
  )
}

/** Active contributors: distinct author names */
export function computeActiveContributors(
  commits: Array<{ author_name: string }>
): number {
  return new Set(commits.map((c) => c.author_name)).size
}

/**
 * Code churn rate: deletions / (additions + deletions)
 * High = lots of rewriting, low = mostly new code
 */
export function computeCodeChurnRate(
  codeFrequency: Array<{ additions: number; deletions: number }>
): number {
  const totalAdd = codeFrequency.reduce((s, w) => s + w.additions, 0)
  const totalDel = codeFrequency.reduce((s, w) => s + w.deletions, 0)
  const total = totalAdd + totalDel
  return total > 0 ? Math.round((totalDel / total) * 100) / 100 : 0
}

/** Average commit size from code frequency and commit count */
export function computeAvgCommitSize(
  codeFrequency: Array<{ additions: number; deletions: number }>,
  commitCount: number
): number {
  if (commitCount === 0) return 0
  const totalChanges = codeFrequency.reduce(
    (s, w) => s + w.additions + w.deletions,
    0
  )
  return Math.round(totalChanges / commitCount)
}

/** Compute all metrics at once */
export function computeAllMetrics(params: {
  commits: Array<{ committed_at: string; author_name: string }>
  codeFrequency: Array<{ weekStart: string; additions: number; deletions: number }>
  deployments: Array<{ state: string; build_duration_ms?: number | null }>
  days: number
}): ProjectMetrics {
  return {
    codeVelocityWeekly: computeCodeVelocity(params.codeFrequency),
    commitConsistencyScore: computeCommitConsistency(params.commits, params.days),
    deploySuccessRate: computeDeploySuccessRate(params.deployments),
    avgBuildTimeMs: computeAvgBuildTime(params.deployments),
    activeContributors: computeActiveContributors(params.commits),
    codeChurnRate: computeCodeChurnRate(params.codeFrequency),
    avgCommitSize: computeAvgCommitSize(params.codeFrequency, params.commits.length),
  }
}
