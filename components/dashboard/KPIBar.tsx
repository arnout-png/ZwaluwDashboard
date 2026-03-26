import { GitCommitHorizontal, Rocket, FolderGit2, Gauge, CircleDollarSign, Activity } from 'lucide-react'
import { PROJECTS } from '@/lib/projects'

type KPI = {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
}

export function KPIBar({
  totalCommits,
  activeProjects,
  totalDeployments,
  avgQuality,
  totalCostEur,
}: {
  totalCommits: number
  activeProjects: number
  totalDeployments: number
  avgQuality: number
  totalCostEur: number | null
}) {
  const kpis: KPI[] = [
    {
      label: 'Commits (30d)',
      value: totalCommits,
      sub: 'over alle projecten',
      icon: <GitCommitHorizontal className="h-5 w-5 text-blue-400" />,
    },
    {
      label: 'Actieve projecten',
      value: activeProjects,
      sub: `van de ${PROJECTS.length}`,
      icon: <FolderGit2 className="h-5 w-5 text-emerald-400" />,
    },
    {
      label: 'Deployments (30d)',
      value: totalDeployments,
      sub: 'naar Vercel',
      icon: <Rocket className="h-5 w-5 text-purple-400" />,
    },
    {
      label: 'Gem. kwaliteit',
      value: `${avgQuality}/100`,
      sub: 'portfolio-score',
      icon: <Gauge className="h-5 w-5 text-cyan-400" />,
    },
    ...(totalCostEur !== null
      ? [
          {
            label: 'Kosten (maand)',
            value: `€${Math.round(totalCostEur)}`,
            sub: 'geschat',
            icon: <CircleDollarSign className="h-5 w-5 text-amber-400" />,
          },
        ]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5"
        >
          <div className="mt-0.5 rounded-lg bg-zinc-800 p-2">{kpi.icon}</div>
          <div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-sm font-medium text-zinc-300">{kpi.label}</p>
            {kpi.sub && <p className="text-xs text-zinc-500">{kpi.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
