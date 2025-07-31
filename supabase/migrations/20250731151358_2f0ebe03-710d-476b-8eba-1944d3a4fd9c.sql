-- First check current user and their role
SELECT auth.uid() as current_user_id;

-- Check if current user has admin role
SELECT user_id, role FROM user_roles WHERE user_id = auth.uid();

-- If no admin role, let's create the completion record directly
-- Phase 1: Immediate fix for Sara - create missing user_unit_progress record
INSERT INTO user_unit_progress (
  user_id,
  unit_id, 
  course_id,
  completed,
  completed_at,
  quiz_completed,
  quiz_completed_at,
  completion_method
) VALUES (
  '7bc548ec-3eca-4f01-9f6b-3f19daa83f27',
  'a44f0984-18a6-4027-9143-f123a2649d17', 
  '40cd2ef8-2db6-474c-b635-86df1835c5e1',
  true,
  now(),
  true,
  now(),
  'admin_manual_fix'
) ON CONFLICT (user_id, unit_id, course_id) 
DO UPDATE SET
  completed = true,
  completed_at = COALESCE(user_unit_progress.completed_at, now()),
  quiz_completed = true,
  quiz_completed_at = COALESCE(user_unit_progress.quiz_completed_at, now()),
  completion_method = 'admin_manual_fix',
  updated_at = now();

-- Update course progress
SELECT update_course_progress_reliable(
  '7bc548ec-3eca-4f01-9f6b-3f19daa83f27'::uuid,
  '40cd2ef8-2db6-474c-b635-86df1835c5e1'::uuid
);