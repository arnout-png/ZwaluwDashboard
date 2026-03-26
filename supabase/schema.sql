-- Zwaluw Dashboard — Supabase schema
-- Voer dit uit in de Supabase SQL Editor van je nieuwe project

create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────────
-- Tabellen
-- ───────────────────────────────────────────────

create table if not exists projects (
  id                 text primary key,
  name               text not null,
  description        text,
  github_owner       text,
  github_repo        text,
  vercel_project_id  text,
  tech_stack         text[] default '{}',
  color              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists commits (
  id            text primary key,  -- "{project_id}-{sha}"
  project_id    text not null references projects(id) on delete cascade,
  sha           text not null,
  message       text,
  author_name   text,
  committed_at  timestamptz not null,
  synced_at     timestamptz default now()
);

create table if not exists deployments (
  id             text primary key,  -- "{project_id}-{deployment_id}"
  project_id     text not null references projects(id) on delete cascade,
  deployment_id  text not null,
  url            text,
  state          text,
  deployed_at    timestamptz,
  synced_at      timestamptz default now()
);

create table if not exists language_stats (
  project_id  text not null references projects(id) on delete cascade,
  language    text not null,
  bytes       bigint not null,
  synced_at   timestamptz default now(),
  primary key (project_id, language)
);

create table if not exists ai_summaries (
  project_id      text primary key references projects(id) on delete cascade,
  goal            text,
  business_value  text,
  maturity        integer check (maturity between 1 and 5),
  status          text check (status in ('active', 'planning', 'maintenance', 'inactive')),
  key_insight     text,
  generated_at    timestamptz default now(),
  expires_at      timestamptz default (now() + interval '7 days')
);

create table if not exists portfolio_summaries (
  id            uuid default uuid_generate_v4() primary key,
  summary       text not null,
  generated_at  timestamptz default now(),
  expires_at    timestamptz default (now() + interval '7 days')
);

create table if not exists sync_logs (
  id               uuid default uuid_generate_v4() primary key,
  started_at       timestamptz default now(),
  completed_at     timestamptz,
  status           text check (status in ('running', 'success', 'error')),
  projects_synced  integer default 0,
  error            text
);

-- ───────────────────────────────────────────────
-- Indexen
-- ───────────────────────────────────────────────

create index if not exists idx_commits_project_date    on commits(project_id, committed_at desc);
create index if not exists idx_deployments_project_date on deployments(project_id, deployed_at desc);
create index if not exists idx_ai_summaries_expires    on ai_summaries(expires_at);

-- ───────────────────────────────────────────────
-- Infrastructuur Manager — nieuwe tabellen
-- ───────────────────────────────────────────────

-- Externe services register
create table if not exists services (
  id           text primary key,
  name         text not null,
  category     text not null,  -- 'database'|'hosting'|'voip'|'ai'|'ads'|'email'|'auth'|'domain'|'stt'|'maps'|'image-gen'|'vcs'|'comms'
  provider     text not null,
  icon_slug    text,
  docs_url     text,
  has_cost_api boolean default false,
  notes        text,
  created_at   timestamptz default now()
);

-- Welke projecten gebruiken welke service
create table if not exists service_connections (
  id          uuid default uuid_generate_v4() primary key,
  service_id  text not null references services(id) on delete cascade,
  project_id  text not null references projects(id) on delete cascade,
  env_keys    text[] default '{}',
  unique(service_id, project_id)
);

-- Infra graph edges (project↔service, project↔project)
create table if not exists infra_edges (
  id         uuid default uuid_generate_v4() primary key,
  from_id    text not null,
  from_type  text not null,  -- 'project'|'service'
  to_id      text not null,
  to_type    text not null,
  edge_type  text not null,  -- 'reads'|'writes'|'calls'|'deploys-to'|'cross-db'|'auth'|'webhook'
  label      text,
  created_at timestamptz default now(),
  unique(from_id, to_id, edge_type)
);

-- Maandelijkse kosten schattingen
create table if not exists cost_estimates (
  id          uuid default uuid_generate_v4() primary key,
  service_id  text not null references services(id) on delete cascade,
  month       text not null,   -- 'YYYY-MM'
  amount_eur  numeric(10,2) not null,
  source      text not null,   -- 'hardcoded'|'api'
  plan_name   text,
  details     jsonb,
  synced_at   timestamptz default now(),
  unique(service_id, month)
);

-- GitHub pull requests
create table if not exists github_prs (
  id          text primary key,   -- '{project_id}-{pr_number}'
  project_id  text not null references projects(id) on delete cascade,
  pr_number   integer not null,
  title       text,
  state       text,   -- 'open'|'closed'
  author      text,
  base_branch text,
  head_branch text,
  created_at  timestamptz,
  merged_at   timestamptz,
  url         text,
  synced_at   timestamptz default now()
);

-- GitHub issues
create table if not exists github_issues (
  id           text primary key,  -- '{project_id}-{issue_number}'
  project_id   text not null references projects(id) on delete cascade,
  issue_number integer not null,
  title        text,
  state        text,   -- 'open'|'closed'
  author       text,
  labels       text[] default '{}',
  created_at   timestamptz,
  closed_at    timestamptz,
  url          text,
  synced_at    timestamptz default now()
);

-- GitHub branches
create table if not exists github_branches (
  id               text primary key,  -- '{project_id}-{branch_name}'
  project_id       text not null references projects(id) on delete cascade,
  name             text not null,
  is_default       boolean default false,
  last_commit_sha  text,
  last_commit_date timestamptz,
  synced_at        timestamptz default now()
);

-- Vercel domeinen
create table if not exists vercel_domains (
  id             text primary key,  -- '{project_id}-{domain}'
  project_id     text not null references projects(id) on delete cascade,
  domain         text not null,
  is_production  boolean default false,
  verified       boolean default false,
  synced_at      timestamptz default now()
);

-- Supabase DB gezondheid (via Management API)
create table if not exists supabase_health (
  id                  uuid default uuid_generate_v4() primary key,
  supabase_ref        text not null,
  project_id          text references projects(id) on delete set null,
  db_size_mb          numeric,
  active_connections  integer,
  synced_at           timestamptz default now()
);

-- Incident log
create table if not exists incidents (
  id          uuid default uuid_generate_v4() primary key,
  service_id  text references services(id),
  project_id  text references projects(id),
  title       text not null,
  severity    text check (severity in ('low','medium','high','critical')),
  started_at  timestamptz not null,
  resolved_at timestamptz,
  notes       text,
  created_at  timestamptz default now()
);

-- Deployment uitbreiding
alter table deployments
  add column if not exists branch            text,
  add column if not exists commit_sha        text,
  add column if not exists build_duration_ms integer;

-- Extra indexen
create index if not exists idx_github_prs_project    on github_prs(project_id, state);
create index if not exists idx_github_issues_project on github_issues(project_id, state);
create index if not exists idx_github_branches_date  on github_branches(project_id, last_commit_date desc);
create index if not exists idx_cost_estimates_month  on cost_estimates(month);
create index if not exists idx_infra_edges_from      on infra_edges(from_id);
create index if not exists idx_infra_edges_to        on infra_edges(to_id);

-- ───────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────

alter table projects          enable row level security;
alter table commits           enable row level security;
alter table deployments       enable row level security;
alter table language_stats    enable row level security;
alter table ai_summaries      enable row level security;
alter table portfolio_summaries enable row level security;
alter table sync_logs         enable row level security;
alter table services          enable row level security;
alter table service_connections enable row level security;
alter table infra_edges       enable row level security;
alter table cost_estimates    enable row level security;
alter table github_prs        enable row level security;
alter table github_issues     enable row level security;
alter table github_branches   enable row level security;
alter table vercel_domains    enable row level security;
alter table supabase_health   enable row level security;
alter table incidents         enable row level security;

-- Publieke leestoegang (dashboard is niet achter auth)
create policy "public read" on projects          for select using (true);
create policy "public read" on commits           for select using (true);
create policy "public read" on deployments       for select using (true);
create policy "public read" on language_stats    for select using (true);
create policy "public read" on ai_summaries      for select using (true);
create policy "public read" on portfolio_summaries for select using (true);
create policy "public read" on sync_logs         for select using (true);
create policy "public read" on services          for select using (true);
create policy "public read" on service_connections for select using (true);
create policy "public read" on infra_edges       for select using (true);
create policy "public read" on cost_estimates    for select using (true);
create policy "public read" on github_prs        for select using (true);
create policy "public read" on github_issues     for select using (true);
create policy "public read" on github_branches   for select using (true);
create policy "public read" on vercel_domains    for select using (true);
create policy "public read" on supabase_health   for select using (true);
create policy "public read" on incidents         for select using (true);
