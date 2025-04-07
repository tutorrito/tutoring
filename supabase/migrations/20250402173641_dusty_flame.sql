/*
  # Fix Profiles Table and Triggers

  1. Changes
    - Drop and recreate profiles table with correct structure
    - Update handle_new_user function to properly create profiles
    - Add proper RLS policies
    - Add proper timestamps handling

  2. Security
    - Enable RLS
    - Add policies for viewing and updating profiles
*/

-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Recreate profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text check (role = any (array['student'::text, 'tutor'::text, 'admin'::text])) default 'student',
  bio text,
  hourly_rate numeric(10,2),
  is_verified boolean default false,
  education text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create handle_new_user function
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    now(),
    now()
  );
  return new;
end;
$$;

-- Create auth trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Drop existing policies if they exist
do $$
begin
  if exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'profiles' 
    and policyname = 'Public profiles are viewable by everyone'
  ) then
    drop policy "Public profiles are viewable by everyone" on public.profiles;
  end if;

  if exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'profiles' 
    and policyname = 'Users can update own profile'
  ) then
    drop policy "Users can update own profile" on public.profiles;
  end if;
end $$;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();