// Single source of truth for the infrastructure graph.
// Gets upserted into Supabase on each nightly sync.

export type ServiceCategory =
  | 'database'
  | 'hosting'
  | 'voip'
  | 'ai'
  | 'ads'
  | 'email'
  | 'auth'
  | 'domain'
  | 'stt'
  | 'maps'
  | 'image-gen'
  | 'vcs'
  | 'comms'

export type ServiceDefinition = {
  id: string
  name: string
  category: ServiceCategory
  provider: string
  iconSlug: string
  docsUrl: string
  dashboardUrl: string
  hasCostApi: boolean
  notes?: string
}

export type ServiceConnection = {
  serviceId: string
  projectId: string
  envKeys: string[]
}

export type InfraEdge = {
  fromId: string
  fromType: 'project' | 'service'
  toId: string
  toType: 'project' | 'service'
  edgeType: 'reads' | 'writes' | 'calls' | 'deploys-to' | 'cross-db' | 'auth' | 'webhook'
  label?: string
}

export const SERVICES: ServiceDefinition[] = [
  // Supabase — one per project
  {
    id: 'supabase-swiftflow',
    name: 'Supabase (SwiftFlow)',
    category: 'database',
    provider: 'Supabase',
    iconSlug: 'supabase',
    docsUrl: 'https://supabase.com/docs',
    dashboardUrl: 'https://supabase.com/dashboard/project/swiftflow',
    hasCostApi: false,
    notes: 'Meerdere Supabase projecten voor SwiftFlow niches',
  },
  {
    id: 'supabase-zwaluw-portal',
    name: 'Supabase (ZwaluwNest)',
    category: 'database',
    provider: 'Supabase',
    iconSlug: 'supabase',
    docsUrl: 'https://supabase.com/docs',
    dashboardUrl: 'https://supabase.com/dashboard/project/oygbjxzpwnuyxgycofil',
    hasCostApi: false,
    notes: 'Project ref: oygbjxzpwnuyxgycofil',
  },
  {
    id: 'supabase-callflow',
    name: 'Supabase (CallFlow)',
    category: 'database',
    provider: 'Supabase',
    iconSlug: 'supabase',
    docsUrl: 'https://supabase.com/docs',
    dashboardUrl: 'https://supabase.com/dashboard/project/omynoptrdgqwhlotbhzf',
    hasCostApi: false,
    notes: 'Project ref: omynoptrdgqwhlotbhzf',
  },
  {
    id: 'supabase-zwaluwplanner',
    name: 'Supabase (Zwaluwplanner)',
    category: 'database',
    provider: 'Supabase',
    iconSlug: 'supabase',
    docsUrl: 'https://supabase.com/docs',
    dashboardUrl: 'https://supabase.com/dashboard/project/vsebuetvbdfsqidrhtcn',
    hasCostApi: false,
    notes: 'Project ref: vsebuetvbdfsqidrhtcn',
  },
  {
    id: 'supabase-dashboard',
    name: 'Supabase (Dashboard)',
    category: 'database',
    provider: 'Supabase',
    iconSlug: 'supabase',
    docsUrl: 'https://supabase.com/docs',
    dashboardUrl: 'https://supabase.com/dashboard/project/iuqkxkaijlejkmluqvvv',
    hasCostApi: false,
    notes: 'Project ref: iuqkxkaijlejkmluqvvv',
  },
  {
    id: 'supabase-zwaluwflow',
    name: 'Supabase (ZwaluwFlow)',
    category: 'database',
    provider: 'Supabase',
    iconSlug: 'supabase',
    docsUrl: 'https://supabase.com/docs',
    dashboardUrl: 'https://supabase.com/dashboard/project/dpmxvpbvqhsdcbtwyoyw',
    hasCostApi: false,
    notes: 'Project ref: dpmxvpbvqhsdcbtwyoyw',
  },
  // Hosting
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'hosting',
    provider: 'Vercel',
    iconSlug: 'vercel',
    docsUrl: 'https://vercel.com/docs',
    dashboardUrl: 'https://vercel.com/veiligdouchen',
    hasCostApi: false,
    notes: 'Pro plan. Alle deployments + cron jobs.',
  },
  // VCS
  {
    id: 'github',
    name: 'GitHub',
    category: 'vcs',
    provider: 'GitHub',
    iconSlug: 'github',
    docsUrl: 'https://docs.github.com',
    dashboardUrl: 'https://github.com/arnout-png',
    hasCostApi: false,
    notes: 'Repos: arnout-png/*',
  },
  // AI
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    category: 'ai',
    provider: 'Anthropic',
    iconSlug: 'anthropic',
    docsUrl: 'https://docs.anthropic.com',
    dashboardUrl: 'https://console.anthropic.com',
    hasCostApi: false,
    notes: 'Claude Sonnet 4 voor SwiftFlow content gen. Claude Haiku voor Dashboard summaries.',
  },
  {
    id: 'fal-ai',
    name: 'fal.ai',
    category: 'image-gen',
    provider: 'fal.ai',
    iconSlug: 'fal',
    docsUrl: 'https://fal.ai/docs',
    dashboardUrl: 'https://fal.ai/dashboard',
    hasCostApi: false,
    notes: 'Banana Pro 2 model. Badkamer & mensen foto generatie voor SwiftFlow.',
  },
  // Ads
  {
    id: 'meta-marketing',
    name: 'Meta Marketing API',
    category: 'ads',
    provider: 'Meta',
    iconSlug: 'meta',
    docsUrl: 'https://developers.facebook.com/docs/marketing-api',
    dashboardUrl: 'https://business.facebook.com/adsmanager',
    hasCostApi: true,
    notes: 'v21.0 API. Campagnes, ad sets, creatives, CAPI voor SwiftFlow.',
  },
  // Domain
  {
    id: 'transip',
    name: 'TransIP',
    category: 'domain',
    provider: 'TransIP',
    iconSlug: 'transip',
    docsUrl: 'https://api.transip.nl/rest/docs.html',
    dashboardUrl: 'https://www.transip.nl/cp/',
    hasCostApi: false,
    notes: '.nl domeinen registratie & DNS voor SwiftFlow niches.',
  },
  // Comms
  {
    id: 'slack',
    name: 'Slack',
    category: 'comms',
    provider: 'Slack',
    iconSlug: 'slack',
    docsUrl: 'https://api.slack.com',
    dashboardUrl: 'https://app.slack.com',
    hasCostApi: false,
    notes: 'Incoming webhooks voor lead alerts & pipeline errors (SwiftFlow).',
  },
  // Email + Calendar
  {
    id: 'google-cloud',
    name: 'Google Cloud',
    category: 'email',
    provider: 'Google',
    iconSlug: 'google',
    docsUrl: 'https://cloud.google.com/docs',
    dashboardUrl: 'https://console.cloud.google.com',
    hasCostApi: false,
    notes: 'Service Account (domain-wide delegation). Gmail, Google Sheets, Google Calendar voor ZwaluwNest.',
  },
  // VoIP
  {
    id: 'telnyx',
    name: 'Telnyx',
    category: 'voip',
    provider: 'Telnyx',
    iconSlug: 'telnyx',
    docsUrl: 'https://developers.telnyx.com',
    dashboardUrl: 'https://portal.telnyx.com',
    hasCostApi: false,
    notes: 'Nederlands nummer +319701028976. WebRTC + SIP voor CallFlow & ZwaluwNest.',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'voip',
    provider: 'Twilio',
    iconSlug: 'twilio',
    docsUrl: 'https://www.twilio.com/docs',
    dashboardUrl: 'https://console.twilio.com',
    hasCostApi: true,
    notes: 'Softphone TwiML app. Bellen & SMS voor CallFlow & ZwaluwNest.',
  },
  // Speech-to-text
  {
    id: 'deepgram',
    name: 'Deepgram',
    category: 'stt',
    provider: 'Deepgram',
    iconSlug: 'deepgram',
    docsUrl: 'https://developers.deepgram.com',
    dashboardUrl: 'https://console.deepgram.com',
    hasCostApi: false,
    notes: 'Nederlandse spraak-naar-tekst transcriptie voor CallFlow.',
  },
  // Email
  {
    id: 'resend',
    name: 'Resend',
    category: 'email',
    provider: 'Resend',
    iconSlug: 'resend',
    docsUrl: 'https://resend.com/docs',
    dashboardUrl: 'https://resend.com/emails',
    hasCostApi: false,
    notes: 'Transactionele e-mail voor ZwaluwNest.',
  },
  // Auth
  {
    id: 'lovable',
    name: 'Lovable Cloud Auth',
    category: 'auth',
    provider: 'Lovable',
    iconSlug: 'lovable',
    docsUrl: 'https://docs.lovable.dev',
    dashboardUrl: 'https://lovable.dev/projects',
    hasCostApi: false,
    notes: 'Authenticatie voor Zwaluwplanner.',
  },
  // Maps
  {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'maps',
    provider: 'Google',
    iconSlug: 'google-maps',
    docsUrl: 'https://developers.google.com/maps',
    dashboardUrl: 'https://console.cloud.google.com/google/maps-apis',
    hasCostApi: false,
    notes: 'Street View & geolocatie voor lead detail pagina\'s in CallFlow.',
  },
]

export const SERVICE_CONNECTIONS: ServiceConnection[] = [
  // SwiftFlow
  { serviceId: 'supabase-swiftflow', projectId: 'swiftflow', envKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  { serviceId: 'vercel', projectId: 'swiftflow', envKeys: ['VERCEL_TOKEN', 'VERCEL_TEAM_ID'] },
  { serviceId: 'github', projectId: 'swiftflow', envKeys: ['GITHUB_TOKEN'] },
  { serviceId: 'anthropic', projectId: 'swiftflow', envKeys: ['ANTHROPIC_API_KEY'] },
  { serviceId: 'fal-ai', projectId: 'swiftflow', envKeys: ['FAL_KEY'] },
  { serviceId: 'meta-marketing', projectId: 'swiftflow', envKeys: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'] },
  { serviceId: 'transip', projectId: 'swiftflow', envKeys: ['TRANSIP_LOGIN', 'TRANSIP_PRIVATE_KEY'] },
  { serviceId: 'slack', projectId: 'swiftflow', envKeys: ['SLACK_WEBHOOK_URL'] },
  // ZwaluwNest
  { serviceId: 'supabase-zwaluw-portal', projectId: 'zwaluw-portal', envKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  { serviceId: 'vercel', projectId: 'zwaluw-portal', envKeys: [] },
  { serviceId: 'google-cloud', projectId: 'zwaluw-portal', envKeys: ['GOOGLE_SERVICE_ACCOUNT_BASE64', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
  { serviceId: 'telnyx', projectId: 'zwaluw-portal', envKeys: ['TELNYX_API_KEY', 'TELNYX_PHONE_NUMBER'] },
  { serviceId: 'twilio', projectId: 'zwaluw-portal', envKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'] },
  { serviceId: 'resend', projectId: 'zwaluw-portal', envKeys: ['RESEND_API_KEY'] },
  // CallFlow
  { serviceId: 'supabase-callflow', projectId: 'callflow', envKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  { serviceId: 'supabase-zwaluw-portal', projectId: 'callflow', envKeys: ['LEADFLOW_SUPABASE_URL', 'LEADFLOW_SERVICE_ROLE_KEY'] },
  { serviceId: 'vercel', projectId: 'callflow', envKeys: [] },
  { serviceId: 'github', projectId: 'callflow', envKeys: [] },
  { serviceId: 'twilio', projectId: 'callflow', envKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'] },
  { serviceId: 'telnyx', projectId: 'callflow', envKeys: ['TELNYX_API_KEY', 'TELNYX_CONNECTION_ID'] },
  { serviceId: 'deepgram', projectId: 'callflow', envKeys: ['DEEPGRAM_API_KEY'] },
  { serviceId: 'google-maps', projectId: 'callflow', envKeys: ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] },
  // Zwaluwplanner
  { serviceId: 'supabase-zwaluwplanner', projectId: 'zwaluwplanner', envKeys: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] },
  { serviceId: 'lovable', projectId: 'zwaluwplanner', envKeys: [] },
  { serviceId: 'github', projectId: 'zwaluwplanner', envKeys: [] },
  // ZwaluwFlow
  { serviceId: 'supabase-zwaluwflow', projectId: 'zwaluwflow', envKeys: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] },
  { serviceId: 'github', projectId: 'zwaluwflow', envKeys: [] },
  // Dashboard
  { serviceId: 'supabase-dashboard', projectId: 'zwaluw-dashboard', envKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  { serviceId: 'vercel', projectId: 'zwaluw-dashboard', envKeys: ['VERCEL_TOKEN', 'VERCEL_TEAM_ID'] },
  { serviceId: 'github', projectId: 'zwaluw-dashboard', envKeys: ['GITHUB_TOKEN'] },
  { serviceId: 'anthropic', projectId: 'zwaluw-dashboard', envKeys: ['ANTHROPIC_API_KEY'] },
]

export const INFRA_EDGES: InfraEdge[] = [
  // Deployments
  { fromId: 'swiftflow',       fromType: 'project', toId: 'vercel', toType: 'service', edgeType: 'deploys-to' },
  { fromId: 'zwaluw-portal',   fromType: 'project', toId: 'vercel', toType: 'service', edgeType: 'deploys-to' },
  { fromId: 'callflow',        fromType: 'project', toId: 'vercel', toType: 'service', edgeType: 'deploys-to' },
  { fromId: 'zwaluw-dashboard',fromType: 'project', toId: 'vercel', toType: 'service', edgeType: 'deploys-to' },

  // Project → primary database (writes)
  { fromId: 'swiftflow',       fromType: 'project', toId: 'supabase-swiftflow',    toType: 'service', edgeType: 'writes' },
  { fromId: 'swiftflow',       fromType: 'project', toId: 'supabase-swiftflow',    toType: 'service', edgeType: 'reads' },
  { fromId: 'zwaluw-portal',   fromType: 'project', toId: 'supabase-zwaluw-portal',toType: 'service', edgeType: 'writes' },
  { fromId: 'zwaluw-portal',   fromType: 'project', toId: 'supabase-zwaluw-portal',toType: 'service', edgeType: 'reads' },
  { fromId: 'callflow',        fromType: 'project', toId: 'supabase-callflow',     toType: 'service', edgeType: 'writes' },
  { fromId: 'callflow',        fromType: 'project', toId: 'supabase-callflow',     toType: 'service', edgeType: 'reads' },
  { fromId: 'zwaluwplanner',   fromType: 'project', toId: 'supabase-zwaluwplanner',toType: 'service', edgeType: 'writes' },
  { fromId: 'zwaluwplanner',   fromType: 'project', toId: 'supabase-zwaluwplanner',toType: 'service', edgeType: 'reads' },
  { fromId: 'zwaluwflow',      fromType: 'project', toId: 'supabase-zwaluwflow',  toType: 'service', edgeType: 'writes' },
  { fromId: 'zwaluwflow',      fromType: 'project', toId: 'supabase-zwaluwflow',  toType: 'service', edgeType: 'reads' },
  { fromId: 'zwaluw-dashboard',fromType: 'project', toId: 'supabase-dashboard',   toType: 'service', edgeType: 'writes' },
  { fromId: 'zwaluw-dashboard',fromType: 'project', toId: 'supabase-dashboard',   toType: 'service', edgeType: 'reads' },

  // ⚠️ Cross-DB dependency: CallFlow leest LeadFlow data via ZwaluwNest Supabase
  { fromId: 'callflow', fromType: 'project', toId: 'supabase-zwaluw-portal', toType: 'service', edgeType: 'cross-db', label: 'leadflow_unique_id' },

  // VoIP
  { fromId: 'callflow',      fromType: 'project', toId: 'twilio',  toType: 'service', edgeType: 'calls' },
  { fromId: 'callflow',      fromType: 'project', toId: 'telnyx',  toType: 'service', edgeType: 'calls' },
  { fromId: 'callflow',      fromType: 'project', toId: 'deepgram',toType: 'service', edgeType: 'calls' },
  { fromId: 'zwaluw-portal', fromType: 'project', toId: 'telnyx',  toType: 'service', edgeType: 'calls' },
  { fromId: 'zwaluw-portal', fromType: 'project', toId: 'twilio',  toType: 'service', edgeType: 'calls' },

  // Auth + integrations
  { fromId: 'zwaluw-portal',   fromType: 'project', toId: 'google-cloud', toType: 'service', edgeType: 'auth' },
  { fromId: 'zwaluw-portal',   fromType: 'project', toId: 'resend',       toType: 'service', edgeType: 'calls' },
  { fromId: 'zwaluwplanner',   fromType: 'project', toId: 'lovable',      toType: 'service', edgeType: 'auth' },
  { fromId: 'callflow',        fromType: 'project', toId: 'google-maps',  toType: 'service', edgeType: 'calls' },

  // AI
  { fromId: 'swiftflow',       fromType: 'project', toId: 'anthropic', toType: 'service', edgeType: 'calls' },
  { fromId: 'swiftflow',       fromType: 'project', toId: 'fal-ai',    toType: 'service', edgeType: 'calls' },
  { fromId: 'zwaluw-dashboard',fromType: 'project', toId: 'anthropic', toType: 'service', edgeType: 'calls' },

  // Ads + domain
  { fromId: 'swiftflow', fromType: 'project', toId: 'meta-marketing', toType: 'service', edgeType: 'calls' },
  { fromId: 'swiftflow', fromType: 'project', toId: 'transip',        toType: 'service', edgeType: 'calls' },
  { fromId: 'swiftflow', fromType: 'project', toId: 'slack',          toType: 'service', edgeType: 'webhook' },

  // Business logic flow: SwiftFlow → LeadFlow → CallFlow
  { fromId: 'swiftflow', fromType: 'project', toId: 'leadflow', toType: 'project', edgeType: 'writes', label: 'genereert leads' },
  { fromId: 'leadflow',  fromType: 'project', toId: 'callflow', toType: 'project', edgeType: 'reads',  label: 'belt leads op' },

  // Dashboard reads GitHub + Vercel
  { fromId: 'zwaluw-dashboard', fromType: 'project', toId: 'github', toType: 'service', edgeType: 'reads' },
  { fromId: 'zwaluw-dashboard', fromType: 'project', toId: 'vercel', toType: 'service', edgeType: 'reads' },
]
