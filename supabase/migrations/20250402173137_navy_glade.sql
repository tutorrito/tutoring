/*
  # Fix Authentication Flow and Policies

  1. Changes
    - Add timestamps to profiles table if missing
    - Update handle_new_user function
    - Fix public profile viewing policy
    - Handle existing policies gracefully
*/

-- Add timestamps if they don't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'created_at'
  ) then
    alter table public.profiles add column created_at timestamptz default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'updated_at'
  ) then
    alter table public.profiles add column updated_at timestamptz default now();
  end if;
end $$;

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
    and policyname = 'Users can view own profile'
  ) then
    drop policy "Users can view own profile" on public.profiles;
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

-- Update handle_new_user function
create or replace function public.handle_new_user()
returns trigger as $$
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
$$ language plpgsql security definer;

-- Add policies for profile management
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);