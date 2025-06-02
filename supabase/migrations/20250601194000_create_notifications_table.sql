CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read_at TIMESTAMPTZ,
    CONSTRAINT check_notification_type CHECK (type IN ('arrival_update', 'new_message', 'session_reminder', 'booking_confirmed', 'booking_cancelled', 'generic')) 
    -- Add more types as needed
);

COMMENT ON TABLE notifications IS 'Stores notifications for users.';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification.';
COMMENT ON COLUMN notifications.user_id IS 'The ID of the user who should receive this notification.';
COMMENT ON COLUMN notifications.type IS 'Type of notification (e.g., arrival_update, new_message).';
COMMENT ON COLUMN notifications.message IS 'The main content of the notification.';
COMMENT ON COLUMN notifications.metadata IS 'Additional data related to the notification (e.g., session_id, sender_id).';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read the notification.';
COMMENT ON COLUMN notifications.created_at IS 'Timestamp when the notification was created.';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the notification was marked as read.';

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications:
-- Users can select their own notifications.
CREATE POLICY "Users can select their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read).
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service roles or specific functions can insert notifications.
-- This policy allows any authenticated user to insert notifications for themselves,
-- which might be too permissive. Typically, inserts are handled by backend functions or triggers.
-- For now, let's assume backend functions will handle inserts with service_role key.
-- If client-side insertion is needed for specific cases (e.g., user creating a reminder for themselves),
-- a more restrictive policy would be required.

-- Example: Allow service_role to do anything (usually default if no specific insert policy for users)
-- CREATE POLICY "Allow service_role to insert notifications"
-- ON notifications
-- FOR INSERT
-- WITH CHECK (true); -- Or specify role, e.g. auth.role() = 'service_role'

-- Indexes
CREATE INDEX idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);
