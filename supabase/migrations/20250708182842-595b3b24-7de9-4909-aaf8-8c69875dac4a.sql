-- Change the default audience for notifications table to admin_only
ALTER TABLE notifications ALTER COLUMN audience SET DEFAULT 'admin_only';