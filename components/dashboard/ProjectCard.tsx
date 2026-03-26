import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Sparkline } from './Sparkline'
import { QualityBadge } from './QualityGauge'
import type { QualityResult } from '@/lib/quality-score'

function deploymentVariant(state: string | null) {
  if (!state) return 'secondary' as const
  if (state === 'READY') return 'success' as const
  if (state === 'ERROR' || state === 'CANCELED') return 'error' as const
  if (state === 'BUILDING') return 'warning' as const
  return 'secondary' as const
}

function statusVariant(status: string) {
  if (status === 'active') return 'success' as const
  if (status === 'maintenance') return 'warning' as const
  if (status === 'inactive') return 'error' as const
  return 'secondary' as const
}

function MaturityDots({ score }: { score: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-4 rounded-full ${i <= score ? 'bg-amber-400' : 'bg-zinc-700'}`}
        />
      ))}
    </div>
  )
}

export function ProjectCard({
  project,
  commitsByDay,
  latestDeployment,
  summary,
  qualityScore,
}: {
  project: {
    id: string
    name: string
    description: string
    color: string
    techStack: string[]
    vercelProjectId: string | null
  }
  commitsByDay: { date: string; count: number }[]
  latestDeployment: { state: string; url: string } | null
  summary: {
    goal: string
    status: string
    maturity: number
    key_insight: string
  } | null
  qualityScore: QualityResult | null
}) {
  const totalCommits = commitsByDay.reduce((s, d) => s + d.count, 0)

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="font-semibold text-white">{project.name}</h3>
        </div>
        <div className="flex gap-1.5">
          {summary && (
            <Badge variant={statusVariant(summary.status)}>{summary.status}</Badge>
          )}
          {latestDeployment && (
            <Badge variant={deploymentVariant(latestDeployment.state)}>
              {latestDeployment.state}
            </Badge>
          )}
        </div>
      </div>

      {/* Goal */}
      {summary?.goal ? (
        <p className="mb-3 text-sm leading-relaxed text-zinc-400 line-clamp-2">{summary.goal}</p>
      ) : (
        <p className="mb-3 text-sm text-zinc-500">{project.description}</p>
      )}

      {/* Sparkline */}
      <div className="mb-3">
        <Sparkline data={commitsByDay} color={project.color} />
      </div>

      {/* Stats row */}
      <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
        <span>{totalCommits} commits (30d)</span>
        <div className="flex items-center gap-3">
          {qualityScore && <QualityBadge result={qualityScore} />}
          {summary && <MaturityDots score={summary.maturity} />}
        </div>
      </div>

      {/* Tech stack */}
      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.techStack.slice(0, 4).map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  )
}
