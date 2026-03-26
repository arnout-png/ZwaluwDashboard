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
-- Row Level Security
-- ───────────────────────────────────────────────

alter table projects          enable row level security;
alter table commits           enable row level security;
alter table deployments       enable row level security;
alter table language_stats    enable row level security;
alter table ai_summaries      enable row level security;
alter table portfolio_summaries enable row level security;
alter table sync_logs         enable row level security;

-- Publieke leestoegang (dashboard is niet achter auth)
create policy "public read" on projects          for select using (true);
create policy "public read" on commits           for select using (true);
create policy "public read" on deployments       for select using (true);
create policy "public read" on language_stats    for select using (true);
create policy "public read" on ai_summaries      for select using (true);
create policy "public read" on portfolio_summaries for select using (true);
create policy "public read" on sync_logs         for select using (true);
