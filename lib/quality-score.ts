/**
 * Project Quality Score — 0–100 gauge per project
 *
 * Weighted dimensions:
 *   Commit frequency (30d)     25%
 *   Deployment health          20%
 *   Code maturity (AI)         20%
 *   Infra completeness         15%
 *   Code diversity             10%
 *   Documentation signals      10%
 */

export type QualityInput = {
  commitCount30d: number
  deployments: Array<{ state: string }>
  totalBytes: number
  languages: Array<{ language: string; bytes: number }>
  hasVercel: boolean
  hasSupabase: boolean
  techStackCount: number
  aiMaturity: number | null   // 1–5 from AI summary
  aiStatus: string | null     // 'active' | 'maintenance' | 'inactive' | 'planned'
}

export type QualityResult = {
  score: number             // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  dimensions: {
    label: string
    score: number           // 0–100 per dimension
    weight: number
  }[]
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

export function calculateQualityScore(input: QualityInput): QualityResult {
  // 1. Commit frequency (25%)
  // 0 commits = 0, 5 = 30, 15 = 60, 30+ = 90, 60+ = 100
  const commitScore = clamp(
    input.commitCount30d <= 0
      ? 0
      : input.commitCount30d <= 5
        ? input.commitCount30d * 6
        : input.commitCount30d <= 30
          ? 30 + ((input.commitCount30d - 5) / 25) * 60
          : 90 + Math.min((input.commitCount30d - 30) / 30, 1) * 10
  )

  // 2. Deployment health (20%)
  const deploys = input.deployments
  let deployScore = 0
  if (deploys.length === 0) {
    deployScore = input.hasVercel ? 10 : 0 // Vercel linked but no deploys yet
  } else {
    const successRate = deploys.filter((d) => d.state === 'READY').length / deploys.length
    const latestOk = deploys[0]?.state === 'READY'
    deployScore = clamp(successRate * 70 + (latestOk ? 30 : 0))
  }

  // 3. Code maturity from AI analysis (20%)
  let maturityScore = 40 // default if no AI data
  if (input.aiMaturity !== null) {
    maturityScore = (input.aiMaturity / 5) * 100
  }
  // Boost/penalty based on status
  if (input.aiStatus === 'active') maturityScore = Math.min(100, maturityScore + 10)
  if (input.aiStatus === 'inactive') maturityScore = Math.max(0, maturityScore - 20)
  if (input.aiStatus === 'planned') maturityScore = Math.max(0, maturityScore - 30)

  // 4. Infra completeness (15%)
  let infraScore = 0
  if (input.hasVercel) infraScore += 40
  if (input.hasSupabase) infraScore += 30
  if (input.techStackCount >= 3) infraScore += 20
  if (input.techStackCount >= 5) infraScore += 10

  // 5. Code diversity — healthy projects have 2-5 languages (10%)
  const langCount = input.languages.length
  let diversityScore = 0
  if (langCount >= 2) diversityScore = 50
  if (langCount >= 3) diversityScore = 80
  if (langCount >= 4) diversityScore = 100
  // Bonus: TypeScript presence
  const hasTS = input.languages.some(
    (l) => l.language.toLowerCase() === 'typescript'
  )
  if (hasTS) diversityScore = Math.min(100, diversityScore + 20)

  // 6. Documentation signals (10%) — presence of markdown / docs
  const hasDocs = input.languages.some((l) =>
    ['markdown', 'html'].includes(l.language.toLowerCase())
  )
  const hasTests = input.totalBytes > 50_000 // rough proxy: substantial project
  let docScore = 0
  if (hasDocs) docScore += 50
  if (hasTests) docScore += 30
  if (input.totalBytes > 0) docScore += 20

  const dimensions = [
    { label: 'Commit-frequentie', score: Math.round(commitScore), weight: 25 },
    { label: 'Deploy-gezondheid', score: Math.round(deployScore), weight: 20 },
    { label: 'Code-volwassenheid', score: Math.round(maturityScore), weight: 20 },
    { label: 'Infra-compleetheid', score: Math.round(infraScore), weight: 15 },
    { label: 'Code-diversiteit', score: Math.round(diversityScore), weight: 10 },
    { label: 'Documentatie', score: Math.round(docScore), weight: 10 },
  ]

  const weightedScore = Math.round(
    dimensions.reduce((acc, d) => acc + d.score * (d.weight / 100), 0)
  )

  const grade: QualityResult['grade'] =
    weightedScore >= 85
      ? 'A'
      : weightedScore >= 70
        ? 'B'
        : weightedScore >= 50
          ? 'C'
          : weightedScore >= 30
            ? 'D'
            : 'F'

  return { score: weightedScore, grade, dimensions }
}
