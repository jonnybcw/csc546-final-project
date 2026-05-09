-- Run this in Supabase SQL editor.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  target_language text,
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;

create table if not exists public.context_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  total_entries integer not null,
  summary_json jsonb not null,
  raw_records_json jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  target_language text not null,
  lesson_json jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_title text not null,
  exercise_id text not null,
  correct boolean not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.context_profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.progress_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "context_profiles_own" on public.context_profiles;
create policy "context_profiles_own" on public.context_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lessons_own" on public.lessons;
create policy "lessons_own" on public.lessons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress_events_own" on public.progress_events;
create policy "progress_events_own" on public.progress_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
