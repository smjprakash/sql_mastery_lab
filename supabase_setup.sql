-- =========================================================
-- SQL Mastery Lab — Supabase setup
-- Run this once in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE everywhere).
-- =========================================================

-- 1) PROFILES TABLE ----------------------------------------
-- One row per user (student or admin). id matches auth.users.id.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'student' check (role in ('student','admin')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);


-- 2) AUTO-CREATE PROFILE ON SIGNUP --------------------------
-- Whenever someone signs up through Supabase Auth, this trigger
-- creates their profiles row automatically as role='student'.
-- (Admins should be promoted manually: see step 4 below.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email !~* '@kgcas\.edu\.in$' then
    raise exception 'Only @kgcas.edu.in email addresses may sign up.';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3) PROGRESS TABLE ------------------------------------------
-- One row per (student, question) that has been solved.
create table if not exists public.student_progress (
  id            bigint generated always as identity primary key,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  question_key  text not null,          -- e.g. "2-5" (levelIndex-questionIndex)
  solved        boolean not null default true,
  solved_at     timestamptz not null default now(),
  unique (student_id, question_key)
);

alter table public.student_progress enable row level security;

drop policy if exists "progress_select_own_or_admin" on public.student_progress;
create policy "progress_select_own_or_admin"
  on public.student_progress for select
  using (
    auth.uid() = student_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "progress_insert_own" on public.student_progress;
create policy "progress_insert_own"
  on public.student_progress for insert
  with check (auth.uid() = student_id);

drop policy if exists "progress_update_own" on public.student_progress;
create policy "progress_update_own"
  on public.student_progress for update
  using (auth.uid() = student_id);

drop policy if exists "progress_delete_own" on public.student_progress;
create policy "progress_delete_own"
  on public.student_progress for delete
  using (auth.uid() = student_id);


-- 4) PROMOTE AN ADMIN ------------------------------------------
-- After a person signs up normally as a student, run this once
-- (with their real email) to make them an admin:
--
-- update public.profiles set role = 'admin' where email = 'admin@yourcollege.edu';


-- 5) EMAIL DOMAIN RESTRICTION -----------------------------------
-- No email-domain restriction is applied. Any valid email address
-- can sign up, subject to Supabase Auth email verification settings.
