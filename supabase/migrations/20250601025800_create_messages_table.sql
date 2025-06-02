CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000), -- Max 5000 chars
    is_read BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE public.messages IS 'Stores individual messages within conversations.';
COMMENT ON COLUMN public.messages.id IS 'Unique identifier for the message.';
COMMENT ON COLUMN public.messages.created_at IS 'Timestamp of when the message was sent.';
COMMENT ON COLUMN public.messages.conversation_id IS 'Foreign key to the conversation this message belongs to.';
COMMENT ON COLUMN public.messages.sender_id IS 'Foreign key to the profile of the user who sent the message.';
COMMENT ON COLUMN public.messages.content IS 'The text content of the message.';
COMMENT ON COLUMN public.messages.is_read IS 'Flag indicating if the message has been read by the recipient.';

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages in conversations they are part of"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
    )
);

CREATE POLICY "Users can send messages in conversations they are part of"
ON public.messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
        AND auth.uid() = sender_id -- Sender must be the authenticated user
    )
);

CREATE POLICY "Users can update their own messages (e.g., mark as read by recipient - though this is usually an app logic)"
ON public.messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid()) -- User is part of the conversation
    )
    -- Example: Allow sender to edit their message (not typical for chat, but possible)
    -- OR auth.uid() = sender_id
    -- Example: Allow recipient to mark as read (more complex, usually handled by app logic setting is_read)
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
    )
);


-- Indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC); -- For ordering messages

-- Function to update conversation's last_message_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at on new message
CREATE TRIGGER on_new_message_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message_at();
