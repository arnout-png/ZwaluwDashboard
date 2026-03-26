'use client'

import { useState } from 'react'
import { ChevronDown, GitBranch, Triangle, Database, Globe } from 'lucide-react'

type ProjectLinks = {
  github: string
  githubIssues: string
  githubPRs: string
  vercel: string | null
  supabase: string | null
  supabaseSQL: string | null
}

type QuickLinkProject = {
  id: string
  name: string
  color: string
  links: ProjectLinks
  vercelLiveUrl: string | null
}

export function QuickLinks({ projects }: { projects: QuickLinkProject[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-zinc-300">Snelkoppelingen</span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-5 py-3 space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="min-w-[120px] text-sm text-zinc-300">{project.name}</span>
              <div className="flex items-center gap-1.5">
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                  className="rounded p-1 text-zinc-500 transition-colors hover:text-cyan-400"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                </a>
                {project.links.vercel && (
                  <a
                    href={project.links.vercel}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Vercel"
                    className="rounded p-1 text-zinc-500 transition-colors hover:text-cyan-400"
                  >
                    <Triangle className="h-3.5 w-3.5" />
                  </a>
                )}
                {project.links.supabase && (
                  <a
                    href={project.links.supabase}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Supabase"
                    className="rounded p-1 text-zinc-500 transition-colors hover:text-cyan-400"
                  >
                    <Database className="h-3.5 w-3.5" />
                  </a>
                )}
                {project.vercelLiveUrl && (
                  <a
                    href={project.vercelLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Live URL"
                    className="rounded p-1 text-zinc-500 transition-colors hover:text-cyan-400"
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
