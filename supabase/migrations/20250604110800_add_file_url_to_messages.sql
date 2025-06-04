ALTER TABLE public.messages
ADD COLUMN file_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.messages.file_url IS 'URL of the attached file in Supabase Storage, if any.';

-- Potentially update RLS policies if direct access to file_url needs more specific control,
-- but existing SELECT policies on messages should cover visibility of the file_url column.

-- It's also good practice to consider an index if you expect to query often based on whether a message has a file.
-- CREATE INDEX IF NOT EXISTS idx_messages_has_file ON public.messages ((file_url IS NOT NULL));
-- However, this might be premature optimization. Let's hold off on this index for now.
