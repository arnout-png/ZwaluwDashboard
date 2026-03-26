export type Project = {
  id: string
  name: string
  description: string
  githubOwner: string
  githubRepo: string
  vercelProjectId: string | null
  supabaseRef: string | null
  techStack: string[]
  color: string
}

export const PROJECTS: Project[] = [
  {
    id: 'swiftflow',
    name: 'SwiftFlow',
    description: 'Geautomatiseerde lead gen pipeline (domeinen → SEO-sites → Meta-advertenties)',
    githubOwner: 'arnout-png',
    githubRepo: 'SwiftFlow',
    vercelProjectId: 'swiftflow',
    supabaseRef: null, // meerdere Supabase projecten per niche
    techStack: ['Next.js 15', 'Turborepo', 'pnpm', 'Supabase'],
    color: '#3b82f6',
  },
  {
    id: 'zwaluw-portal',
    name: 'ZwaluwNest',
    description: 'Intern HR & operationeel portaal',
    githubOwner: 'arnout-png',
    githubRepo: 'ZwaluwNest',
    vercelProjectId: 'zwaluw-portal',
    supabaseRef: 'oygbjxzpwnuyxgycofil',
    techStack: ['Next.js 16', 'Prisma 7', 'NextAuth v5', 'Tailwind v4'],
    color: '#8b5cf6',
  },
  {
    id: 'callflow',
    name: 'CallFlow',
    description: 'Callcenter-app met Twilio softphone',
    githubOwner: 'arnout-png',
    githubRepo: 'CallFlow',
    vercelProjectId: 'prj_JA0x4l5RazoXbvMFOmyVbCgc5MLr',
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
    supabaseRef: 'vsebuetvbdfsqidrhtcn',
    techStack: ['Vite', 'React', 'Supabase', 'shadcn/ui'],
    color: '#f59e0b',
  },
  {
    id: 'leadflow',
    name: 'LeadFlow',
    description: 'Lead managementsysteem (gepland)',
    githubOwner: 'arnout-png',
    githubRepo: 'LeadFlow',
    vercelProjectId: null,
    supabaseRef: null,
    techStack: [],
    color: '#ef4444',
  },
  {
    id: 'zwaluw-dashboard',
    name: 'ZwaluwDashboard',
    description: 'Infrastructuur manager voor alle Zwaluw-projecten',
    githubOwner: 'arnout-png',
    githubRepo: 'ZwaluwDashboard',
    vercelProjectId: 'prj_nAzx7pQI2ndwAsUEzT3mggXuWIUU',
    supabaseRef: 'iuqkxkaijlejkmluqvvv',
    techStack: ['Next.js 16', 'Supabase', 'Claude Haiku', 'Recharts'],
    color: '#06b6d4',
  },
]
