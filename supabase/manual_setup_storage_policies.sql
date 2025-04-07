-- SQL to manually run in Supabase Dashboard

-- Create function to setup storage policies
create or replace function public.create_storage_policies(bucket_name text)
returns void
language plpgsql
as $$
begin
  -- Allow authenticated users to upload files
  execute format('
    create policy "Allow uploads"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = %L);
  ', bucket_name);

  -- Allow users to view their own files
  execute format('
    create policy "Allow view"
    on storage.objects for select
    using (bucket_id = %L);
  ', bucket_name);

  -- Allow users to update their own files
  execute format('
    create policy "Allow updates"
    on storage.objects for update
    using (bucket_id = %L);
  ', bucket_name);
end;
$$;

-- Execute the function for the avatars bucket
select public.create_storage_policies('avatars');

-- Create the avatars bucket if it doesn't exist (set public: true for direct access)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS on the storage.objects table
alter table storage.objects enable row level security;
