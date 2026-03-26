import { Sparkles } from 'lucide-react'

export function PortfolioSummary({
  summary,
  generatedAt,
}: {
  summary: string
  generatedAt: string
}) {
  const date = new Date(generatedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-zinc-300">AI Portfolio-samenvatting</h2>
        <span className="ml-auto text-xs text-zinc-500">{date}</span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">{summary}</p>
    </div>
  )
}
