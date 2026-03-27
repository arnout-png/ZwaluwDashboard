export type DateRange = {
  since: Date
  days: number
  label: string
  key: string
}

const RANGES: Record<string, { days: number; label: string }> = {
  '7d': { days: 7, label: '7 dagen' },
  '14d': { days: 14, label: '14 dagen' },
  '30d': { days: 30, label: '30 dagen' },
  '90d': { days: 90, label: '90 dagen' },
}

export function parseDateRange(range?: string): DateRange {
  const r = RANGES[range ?? '30d'] ?? RANGES['30d']
  return {
    since: new Date(Date.now() - r.days * 86_400_000),
    days: r.days,
    label: r.label,
    key: range ?? '30d',
  }
}

export const RANGE_OPTIONS = Object.entries(RANGES).map(([key, v]) => ({
  key,
  label: v.label,
  shortLabel: key,
}))
