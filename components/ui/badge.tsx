import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'error' | 'secondary' | 'info'

const variants: Record<Variant, string> = {
  default:   'bg-zinc-800 text-zinc-300',
  success:   'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  warning:   'bg-amber-900/50  text-amber-400  border border-amber-800',
  error:     'bg-red-900/50    text-red-400    border border-red-800',
  secondary: 'bg-zinc-800      text-zinc-400',
  info:      'bg-sky-900/50    text-sky-400    border border-sky-800',
}

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: Variant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
