
-- Add audience column to notifications table with enum type
CREATE TYPE notification_audience AS ENUM (
  'new_frontier_only',
  'all_students', 
  'all_free',
  'all_owners',
  'all_users'
);

-- Add the audience column to the notifications table
ALTER TABLE public.notifications 
ADD COLUMN audience notification_audience NOT NULL DEFAULT 'all_users';

-- Add index for better performance when filtering by audience
CREATE INDEX idx_notifications_audience ON public.notifications(audience);
