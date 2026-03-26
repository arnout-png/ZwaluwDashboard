'use client'

import {
  LayoutDashboard,
  GitBranch,
  Triangle,
  Network,
  Plug,
  CircleDollarSign,
  FolderKanban,
  LogOut,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { NavItem } from './NavItem'
import { PROJECTS } from '@/lib/projects'

export function Sidebar() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-52 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-zinc-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-bold">
          Z
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Zwaluw HQ</span>
      </div>

      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {/* Portfolio */}
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Portfolio
        </p>
        <NavItem href="/" label="Overzicht" icon={LayoutDashboard} exact />
        <NavItem href="/github" label="GitHub" icon={GitBranch} />
        <NavItem href="/vercel" label="Vercel" icon={Triangle} />

        {/* Infrastructuur */}
        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Infrastructuur
        </p>
        <NavItem href="/infrastructure" label="Infra Map" icon={Network} />
        <NavItem href="/services" label="Services" icon={Plug} />
        <NavItem href="/costs" label="Kosten" icon={CircleDollarSign} />

        {/* Projecten */}
        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Projecten
        </p>
        {PROJECTS.map((p) => (
          <NavItem
            key={p.id}
            href={`/projects/${p.id}`}
            label={p.name}
            icon={FolderKanban}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600">Zwaluw Comfortsanitair</p>
        <button
          onClick={handleLogout}
          title="Uitloggen"
          className="text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )
}
