-- Add 'admin_only' to the notification audience enum
ALTER TYPE notification_audience ADD VALUE 'admin_only';

-- Change the default audience for notifications table to admin_only
ALTER TABLE notifications ALTER COLUMN audience SET DEFAULT 'admin_only';