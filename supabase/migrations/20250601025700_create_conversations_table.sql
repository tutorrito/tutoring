CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_session_conversation UNIQUE (session_id) -- Assuming one conversation per session
);

COMMENT ON TABLE public.conversations IS 'Stores conversation threads related to booked sessions.';
COMMENT ON COLUMN public.conversations.id IS 'Unique identifier for the conversation.';
COMMENT ON COLUMN public.conversations.created_at IS 'Timestamp of when the conversation was created.';
COMMENT ON COLUMN public.conversations.session_id IS 'Foreign key to the session this conversation is about.';
COMMENT ON COLUMN public.conversations.student_id IS 'Foreign key to the profile of the student in the conversation.';
COMMENT ON COLUMN public.conversations.tutor_id IS 'Foreign key to the profile of the tutor in the conversation.';
COMMENT ON COLUMN public.conversations.last_message_at IS 'Timestamp of the last message in this conversation, for sorting.';

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view conversations they are part of"
ON public.conversations
FOR SELECT
USING (
    auth.uid() = student_id OR auth.uid() = tutor_id
);

CREATE POLICY "Users can create conversations if they are the student or tutor related to the session"
ON public.conversations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.sessions s
        WHERE s.id = session_id
        AND (s.user_id = auth.uid() AND auth.uid() = student_id) -- Student booking
    ) OR EXISTS (
        SELECT 1
        FROM public.sessions s
        JOIN public.courses c ON s.course_id = c.id
        WHERE s.id = session_id
        AND (c.tutor_id = auth.uid() AND auth.uid() = tutor_id) -- Tutor of the course
    )
);

-- Indexes
CREATE INDEX idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX idx_conversations_tutor_id ON public.conversations(tutor_id);
CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
