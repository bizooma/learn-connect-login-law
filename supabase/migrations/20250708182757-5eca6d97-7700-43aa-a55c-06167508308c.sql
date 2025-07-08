-- Add 'admin_only' to the notification audience enum (must be in separate transaction)
ALTER TYPE notification_audience ADD VALUE 'admin_only';