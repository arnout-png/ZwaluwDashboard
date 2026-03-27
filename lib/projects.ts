export type Project = {
  id: string
  name: string
  description: string
  githubOwner: string
  githubRepo: string
  vercelProjectId: string | null
  vercelSlug: string | null
  supabaseRef: string | null
  techStack: string[]
  color: string
}

export type ProjectLinks = {
  github: string
  githubIssues: string
  githubPRs: string
  vercel: string | null
  supabase: string | null
  supabaseSQL: string | null
}

export function getProjectLinks(project: Project): ProjectLinks {
  return {
    github: `https://github.com/${project.githubOwner}/${project.githubRepo}`,
    githubIssues: `https://github.com/${project.githubOwner}/${project.githubRepo}/issues`,
    githubPRs: `https://github.com/${project.githubOwner}/${project.githubRepo}/pulls`,
    vercel: project.vercelSlug
      ? `https://vercel.com/veiligdouchen/${project.vercelSlug}`
      : null,
    supabase: project.supabaseRef
      ? `https://supabase.com/dashboard/project/${project.supabaseRef}`
      : null,
    supabaseSQL: project.supabaseRef
      ? `https://supabase.com/dashboard/project/${project.supabaseRef}/sql`
      : null,
  }
}

export const PROJECTS: Project[] = [
  {
    id: 'swiftflow',
    name: 'SwiftFlow',
    description: 'Geautomatiseerde lead gen pipeline (domeinen → SEO-sites → Meta-advertenties)',
    githubOwner: 'arnout-png',
    githubRepo: 'SwiftFlow',
    vercelProjectId: 'swiftflow',
    vercelSlug: 'swiftflow',
    supabaseRef: null, // meerdere Supabase projecten per niche
    techStack: ['Next.js 15', 'Turborepo', 'pnpm', 'Supabase'],
    color: '#3b82f6',
  },
  {
    id: 'zwaluw-portal',
    name: 'ZwaluwNest',
    description: 'Intern HR & operationeel portaal',
    githubOwner: 'arnout-png',
    githubRepo: 'zwaluw-nest',
    vercelProjectId: 'zwaluw-portal',
    vercelSlug: 'zwaluw-portal',
    supabaseRef: 'oygbjxzpwnuyxgycofil',
    techStack: ['Next.js 16', 'Prisma 7', 'NextAuth v5', 'Tailwind v4'],
    color: '#8b5cf6',
  },
  {
    id: 'callflow',
    name: 'CallFlow',
    description: 'Callcenter-app met Twilio softphone',
    githubOwner: 'arnout-png',
    githubRepo: 'callflow-zwaluw',
    vercelProjectId: 'prj_JA0x4l5RazoXbvMFOmyVbCgc5MLr',
    vercelSlug: 'callflow-zwaluw',
    supabaseRef: 'omynoptrdgqwhlotbhzf',
    techStack: ['Next.js 16', 'Supabase', 'Twilio'],
    color: '#10b981',
  },
  {
    id: 'zwaluwplanner',
    name: 'Zwaluwplanner',
    description: 'Klantgerichte planningstool voor badkamerrenovaties',
    githubOwner: 'arnout-png',
    githubRepo: 'Zwaluwplanner',
    vercelProjectId: 'zwaluwplanner',
    vercelSlug: 'zwaluwplanner',
    supabaseRef: 'vsebuetvbdfsqidrhtcn',
    techStack: ['Vite', 'React', 'Supabase', 'shadcn/ui'],
    color: '#f59e0b',
  },
  {
    id: 'zwaluwflow',
    name: 'ZwaluwFlow',
    description: 'Badkamer-planningtool voor klanten (offerte, planning, materialen)',
    githubOwner: 'arnout-png',
    githubRepo: 'zwaluwflow-bath-planning',
    vercelProjectId: null,
    vercelSlug: null,
    supabaseRef: 'dpmxvpbvqhsdcbtwyoyw',
    techStack: ['Vite', 'React', 'Supabase', 'shadcn/ui', 'TanStack Query'],
    color: '#f97316',
  },
  {
    id: 'leadflow',
    name: 'LeadFlow',
    description: 'Lead managementsysteem (gepland)',
    githubOwner: 'arnout-png',
    githubRepo: 'leadflow-zwaluw',
    vercelProjectId: null,
    vercelSlug: null,
    supabaseRef: null,
    techStack: [],
    color: '#ef4444',
  },
  {
    id: 'zwaluw-sales',
    name: 'ZwaluwSales',
    description: 'Sales portal voor offertes, contracten en PDF-generatie',
    githubOwner: 'arnout-png',
    githubRepo: 'zwaluw-sales',
    vercelProjectId: 'prj_VPWJayCk7p4VQaXyAauoqrevb6Km',
    vercelSlug: 'zwaluw-sales',
    supabaseRef: null, // eigen project, ref onbekend
    techStack: ['Next.js', 'Supabase', 'Tailwind', 'React PDF'],
    color: '#ec4899',
  },
  {
    id: 'zwaluw-dashboard',
    name: 'ZwaluwDashboard',
    description: 'Infrastructuur manager voor alle Zwaluw-projecten',
    githubOwner: 'arnout-png',
    githubRepo: 'ZwaluwDashboard',
    vercelProjectId: 'prj_nAzx7pQI2ndwAsUEzT3mggXuWIUU',
    vercelSlug: 'zwaluw-dashboard',
    supabaseRef: 'iuqkxkaijlejkmluqvvv',
    techStack: ['Next.js 16', 'Supabase', 'Claude Haiku', 'Recharts'],
    color: '#06b6d4',
  },
]
