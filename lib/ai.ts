import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

const MODEL = 'claude-haiku-4.5'

export type ProjectSummary = {
  goal: string
  business_value: string
  maturity: number
  status: 'active' | 'planning' | 'maintenance' | 'inactive'
  key_insight: string
}

export async function generateProjectSummary(params: {
  name: string
  description: string
  techStack: string[]
  recentCommits: string[]
  commitCount30d: number
  languages: Record<string, number>
  lastDeploymentState?: string
}): Promise<ProjectSummary | null> {
  const topLangs = Object.entries(params.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang]) => lang)
    .join(', ')

  const prompt = `Je bent een technisch analist voor Zwaluw Comfortsanitair, een Nederlandse badkamerrenovatiespecialist voor senioren (55–75 jaar).

Analyseer dit softwareproject en geef een beknopte JSON-samenvatting:

Project: ${params.name}
Beschrijving: ${params.description}
Tech stack: ${params.techStack.join(', ') || 'onbekend'}
Talen: ${topLangs || 'onbekend'}
Commits laatste 30 dagen: ${params.commitCount30d}
Recente commit-berichten: ${params.recentCommits.slice(0, 5).join(' | ')}
Laatste deployment: ${params.lastDeploymentState ?? 'onbekend'}

Geef ALLEEN geldige JSON terug (geen markdown, geen uitleg):
{
  "goal": "1-2 zinnen over wat dit project doet",
  "business_value": "Waarom dit belangrijk is voor Zwaluw Comfortsanitair",
  "maturity": 3,
  "status": "active",
  "key_insight": "Één observatie over de recente activiteit"
}

maturity: 1=idee, 2=vroeg, 3=actief, 4=productie, 5=volwassen
status: active | planning | maintenance | inactive`

  try {
    const { text } = await generateText({
      model: anthropic(MODEL),
      prompt,
    })
    const match = text.trim().match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    const validStatuses = ['active', 'planning', 'maintenance', 'inactive']
    return {
      goal: String(parsed.goal ?? ''),
      business_value: String(parsed.business_value ?? ''),
      maturity: Math.max(1, Math.min(5, Number(parsed.maturity) || 1)),
      status: validStatuses.includes(parsed.status) ? parsed.status : 'planning',
      key_insight: String(parsed.key_insight ?? ''),
    }
  } catch (err: any) {
    console.error('Project summary failed:', err?.message ?? err, err?.cause ?? '')
    return null
  }
}

export type CommitAnalysis = {
  summary: string
  key_changes: Array<{ area: string; description: string; impact: 'high' | 'medium' | 'low' }>
  patterns: string[]
}

export async function generateCommitAnalysis(params: {
  projectName: string
  commits: Array<{ message: string; additions?: number; deletions?: number; filesChanged?: number }>
  period: string
}): Promise<CommitAnalysis | null> {
  if (params.commits.length === 0) return null

  const commitList = params.commits
    .slice(0, 30)
    .map((c) => {
      const stats = c.additions !== undefined ? ` (+${c.additions}/-${c.deletions}, ${c.filesChanged} files)` : ''
      return `- ${c.message}${stats}`
    })
    .join('\n')

  try {
    const { text } = await generateText({
      model: anthropic(MODEL),
      prompt: `Je bent een technisch analist. Analyseer de recente commits van het project "${params.projectName}" (${params.period}).

Commits:
${commitList}

Geef ALLEEN geldige JSON terug:
{
  "summary": "2-3 zinnen samenvatting van wat er veranderd is in het Nederlands",
  "key_changes": [
    {"area": "korte categorie", "description": "wat is veranderd", "impact": "high|medium|low"}
  ],
  "patterns": ["observatie over commit-patronen"]
}

Max 5 key_changes, max 3 patterns. Schrijf in het Nederlands.`,
    })
    const match = text.trim().match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    return {
      summary: String(parsed.summary ?? ''),
      key_changes: Array.isArray(parsed.key_changes)
        ? parsed.key_changes.slice(0, 5).map((c: any) => ({
            area: String(c.area ?? ''),
            description: String(c.description ?? ''),
            impact: ['high', 'medium', 'low'].includes(c.impact) ? c.impact : 'medium',
          }))
        : [],
      patterns: Array.isArray(parsed.patterns)
        ? parsed.patterns.slice(0, 3).map(String)
        : [],
    }
  } catch (err) {
    console.error('Commit analysis failed:', err)
    return null
  }
}

export async function generatePortfolioSummary(
  projects: Array<{
    name: string
    status: string
    maturity: number
    commitCount30d: number
    goal: string
  }>
): Promise<string | null> {
  const list = projects
    .map(
      (p) =>
        `- ${p.name}: ${p.goal} (status: ${p.status}, volwassenheid: ${p.maturity}/5, commits/30d: ${p.commitCount30d})`
    )
    .join('\n')

  try {
    const { text } = await generateText({
      model: anthropic(MODEL),
      prompt: `Je bent technisch directeur van Zwaluw Comfortsanitair. Schrijf een beknopte portfolio-samenvatting (max 150 woorden) op basis van deze projecten:\n\n${list}\n\nBeschrijf de technische focus, het meest actieve project, eventuele aandachtspunten en de algehele portfolio-gezondheid. Schrijf in het Nederlands, professioneel maar direct.`,
    })
    return text
  } catch {
    return null
  }
}
