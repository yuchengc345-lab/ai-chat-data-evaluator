create extension if not exists "pgcrypto";

create table if not exists public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  industry text not null,
  file_name text,
  total_conversations integer not null default 0,
  high_purchase_intent_count integer not null default 0,
  negative_emotion_count integer not null default 0,
  requires_follow_up_count integer not null default 0,
  analysis_json jsonb not null
);

create index if not exists analysis_reports_created_at_idx
  on public.analysis_reports (created_at desc);

create index if not exists analysis_reports_industry_idx
  on public.analysis_reports (industry);
