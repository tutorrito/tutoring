/*
  # Database Schema Update

  1. Tables
    - Modify profiles table with additional fields
    - Create subjects table
    - Create tutor_subjects table
    - Create sessions table
    - Create reviews table
    - Create messages table

  2. Security
    - Enable RLS on all tables
    - Set up appropriate policies for each table
*/

-- Modify profiles table
alter table public.profiles
add column if not exists role text check (role = any (array['student'::text, 'tutor'::text, 'admin'::text])),
add column if not exists bio text,
add column if not exists hourly_rate numeric(10,2),
add column if not exists is_verified boolean default false,
add column if not exists education text;

-- Create subjects table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- Create tutor_subjects table
create table if not exists public.tutor_subjects (
  tutor_id uuid references public.profiles(id),
  subject_id uuid references public.subjects(id),
  created_at timestamptz default now(),
  primary key (tutor_id, subject_id)
);

-- Create sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id),
  tutor_id uuid references public.profiles(id),
  subject_id uuid references public.subjects(id),
  start_time timestamptz not null,
  duration integer not null,
  status text not null check (status = any (array['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id),
  reviewer_id uuid references public.profiles(id),
  reviewee_id uuid references public.profiles(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.subjects enable row level security;
alter table public.tutor_subjects enable row level security;
alter table public.sessions enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;

-- Drop existing policies
do $$
begin
  -- Drop subjects policies
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'subjects' and policyname = 'Subjects are viewable by everyone'
  ) then
    drop policy "Subjects are viewable by everyone" on public.subjects;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'subjects' and policyname = 'Admins can manage subjects'
  ) then
    drop policy "Admins can manage subjects" on public.subjects;
  end if;

  -- Drop tutor_subjects policies
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tutor_subjects' and policyname = 'Tutor subjects are viewable by everyone'
  ) then
    drop policy "Tutor subjects are viewable by everyone" on public.tutor_subjects;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tutor_subjects' and policyname = 'Tutors can manage their subjects'
  ) then
    drop policy "Tutors can manage their subjects" on public.tutor_subjects;
  end if;

  -- Drop sessions policies
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'sessions' and policyname = 'Users can view their sessions'
  ) then
    drop policy "Users can view their sessions" on public.sessions;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'sessions' and policyname = 'Students can create sessions'
  ) then
    drop policy "Students can create sessions" on public.sessions;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'sessions' and policyname = 'Session participants can update status'
  ) then
    drop policy "Session participants can update status" on public.sessions;
  end if;

  -- Drop reviews policies
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'Users can view reviews'
  ) then
    drop policy "Users can view reviews" on public.reviews;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'Session participants can create reviews'
  ) then
    drop policy "Session participants can create reviews" on public.reviews;
  end if;

  -- Drop messages policies
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'Users can view their messages'
  ) then
    drop policy "Users can view their messages" on public.messages;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'Users can send messages'
  ) then
    drop policy "Users can send messages" on public.messages;
  end if;
end $$;

-- Create new policies
-- Policies for subjects
create policy "Subjects are viewable by everyone"
  on public.subjects for select
  to public
  using (true);

create policy "Admins can manage subjects"
  on public.subjects for all
  to public
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policies for tutor_subjects
create policy "Tutor subjects are viewable by everyone"
  on public.tutor_subjects for select
  to public
  using (true);

create policy "Tutors can manage their subjects"
  on public.tutor_subjects for all
  to public
  using (auth.uid() = tutor_id);

-- Policies for sessions
create policy "Users can view their sessions"
  on public.sessions for select
  to public
  using (auth.uid() = student_id or auth.uid() = tutor_id);

create policy "Students can create sessions"
  on public.sessions for insert
  to public
  with check (auth.uid() = student_id);

create policy "Session participants can update status"
  on public.sessions for update
  to public
  using (auth.uid() = student_id or auth.uid() = tutor_id);

-- Policies for reviews
create policy "Users can view reviews"
  on public.reviews for select
  to public
  using (true);

create policy "Session participants can create reviews"
  on public.reviews for insert
  to public
  with check (
    exists (
      select 1 from sessions
      where sessions.id = reviews.session_id
      and (auth.uid() = sessions.student_id or auth.uid() = sessions.tutor_id)
    )
  );

-- Policies for messages
create policy "Users can view their messages"
  on public.messages for select
  to public
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  to public
  with check (auth.uid() = sender_id);