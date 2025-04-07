-- Create function to setup storage policies for avatars bucket
create or replace function public.create_storage_policies()
returns void
language plpgsql
as $$
begin
  -- Allow authenticated users to upload files
  execute '
    create policy "Allow uploads"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = ''avatars'');
  ';

  -- Allow users to view their own files
  execute '
    create policy "Allow view"
    on storage.objects for select
    using (bucket_id = ''avatars'');
  ';

  -- Allow users to update their own files
  execute '
    create policy "Allow updates"
    on storage.objects for update
    using (bucket_id = ''avatars'');
  ';

  -- Allow users to access their own profile images
  execute '
    create policy "Allow profile image access"
    on storage.objects for select
    using (
      bucket_id = ''avatars'' AND
      auth.uid()::text = (storage.foldername(name))[1] AND
      name LIKE ''avatars/%%''
    );
  ';
end;
$$;
