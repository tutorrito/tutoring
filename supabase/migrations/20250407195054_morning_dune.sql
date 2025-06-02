-- First, enable RLS on storage.objects if not already enabled
alter table storage.objects enable row level security;

-- Create function to setup storage policies
create or replace function public.create_storage_policies(bucket_name text)
returns void
language plpgsql
as $$
begin
  -- Drop existing policies if they exist
  execute format('
    drop policy if exists "Allow uploads" on storage.objects;
    drop policy if exists "Allow view" on storage.objects;
    drop policy if exists "Allow updates" on storage.objects;
  ');

  -- Allow authenticated users to upload files
  execute format('
    create policy "Allow uploads"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = %L);
  ', bucket_name);

  -- Allow users to view files
  execute format('
    create policy "Allow view"
    on storage.objects for select
    to authenticated
    using (bucket_id = %L);
  ', bucket_name);

  -- Allow users to update their own files
  execute format('
    create policy "Allow updates"
    on storage.objects for update
    to authenticated
    using (bucket_id = %L);
  ', bucket_name);

  -- Allow users to delete their own files
  execute format('
    create policy "Allow delete"
    on storage.objects for delete
    to authenticated
    using (bucket_id = %L);
  ', bucket_name);
end;
$$;

-- Create the avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Execute the function for the avatars bucket
select public.create_storage_policies('avatars');