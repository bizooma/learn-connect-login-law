
-- First, let's check if there's already a unique constraint on user_unit_progress
-- If not, we need to add it for the ON CONFLICT clause to work

-- Add unique constraint to user_unit_progress table
ALTER TABLE public.user_unit_progress 
ADD CONSTRAINT user_unit_progress_unique 
UNIQUE (user_id, unit_id, course_id);
