import { GitCommitHorizontal, Rocket, GitPullRequest } from 'lucide-react'

type ActivityEvent = {
  type: 'commit' | 'deploy' | 'pr'
  projectId: string
  projectName: string
  projectColor: string
  message: string
  timestamp: string
}

const typeIcons: Record<ActivityEvent['type'], React.ReactNode> = {
  commit: <GitCommitHorizontal className="h-4 w-4 text-zinc-500" />,
  deploy: <Rocket className="h-4 w-4 text-zinc-500" />,
  pr: <GitPullRequest className="h-4 w-4 text-zinc-500" />,
}

function timeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'zojuist'
  if (diffMin < 60) return `${diffMin}m geleden`
  if (diffHours < 24) return `${diffHours}u geleden`
  if (diffDays === 1) return 'gisteren'
  if (diffDays < 7) return `${diffDays}d geleden`
  return `${Math.floor(diffDays / 7)}w geleden`
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const visible = events.slice(0, 15)

  if (visible.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">
        Nog geen activiteit gevonden.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {visible.map((event, i) => (
        <div
          key={`${event.projectId}-${event.timestamp}-${i}`}
          className="flex items-start gap-3 border-b border-zinc-800 py-3 last:border-b-0"
        >
          {/* Color dot + vertical line */}
          <div className="flex flex-col items-center pt-1">
            <div
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: event.projectColor }}
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-300">
                {event.projectName}
              </span>
              <span className="text-xs text-zinc-600">
                {timeAgo(event.timestamp)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-zinc-400">
              {event.message}
            </p>
          </div>

          {/* Icon */}
          <div className="flex-shrink-0 pt-1">{typeIcons[event.type]}</div>
        </div>
      ))}
    </div>
  )
}
