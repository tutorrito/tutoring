/*
  # Storage and Initial Data Setup

  1. Storage
    - Create and configure avatars bucket
    - Set up storage policies

  2. Initial Data
    - Add common subjects
    - Add admin user role
*/

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Set up storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Insert initial subjects
insert into public.subjects (name) values
  ('Mathematics'),
  ('Physics'),
  ('Chemistry'),
  ('Biology'),
  ('Computer Science'),
  ('English Language'),
  ('Arabic Language'),
  ('History'),
  ('Geography'),
  ('Economics'),
  ('Business Studies'),
  ('Accounting'),
  ('Statistics'),
  ('Calculus'),
  ('Linear Algebra')
on conflict (name) do nothing;