'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'

type Props = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

export function NavItem({ href, label, icon: Icon, exact = false }: Props) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
      }`}
    >
      <Icon size={15} className="shrink-0" />
      {label}
    </Link>
  )
}
