/*
  # Fix Authentication Flow

  1. Changes
    - Add timestamps to profiles table if missing
    - Update handle_new_user function to set role
    - Add public profile viewing policy
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

-- Add policy for public profile viewing
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);