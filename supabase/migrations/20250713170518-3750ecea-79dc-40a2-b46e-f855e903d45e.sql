-- Cleanup orphaned progress records from deleted Declarations lesson units
-- Phase 1: Create backup table and backup orphaned data
CREATE TABLE IF NOT EXISTS orphaned_progress_backup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL,
  original_table TEXT NOT NULL,
  original_data JSONB NOT NULL,
  user_id UUID NOT NULL,
  course_id UUID,
  unit_id UUID,
  reason TEXT DEFAULT 'Cleanup of orphaned progress from deleted Declarations lesson units',
  backed_up_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Backup orphaned unit progress records
INSERT INTO orphaned_progress_backup (backup_type, original_table, original_data, user_id, course_id, unit_id)
SELECT 
  'unit_progress',
  'user_unit_progress',
  row_to_json(uup),
  uup.user_id,
  uup.course_id,
  uup.unit_id
FROM user_unit_progress uup
WHERE uup.unit_id NOT IN (
  SELECT u.id FROM units u
  WHERE u.is_draft = false
) AND uup.course_id = '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25'; -- Legal Training-300

-- Backup orphaned video progress records  
INSERT INTO orphaned_progress_backup (backup_type, original_table, original_data, user_id, course_id, unit_id)
SELECT 
  'video_progress',
  'user_video_progress',
  row_to_json(uvp),
  uvp.user_id,
  uvp.course_id,
  uvp.unit_id
FROM user_video_progress uvp
WHERE uvp.unit_id NOT IN (
  SELECT u.id FROM units u
  WHERE u.is_draft = false
) AND uvp.course_id = '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25'; -- Legal Training-300

-- Phase 2: Remove orphaned progress records
DELETE FROM user_unit_progress 
WHERE unit_id NOT IN (
  SELECT u.id FROM units u
  WHERE u.is_draft = false
) AND course_id = '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25';

DELETE FROM user_video_progress 
WHERE unit_id NOT IN (
  SELECT u.id FROM units u
  WHERE u.is_draft = false
) AND course_id = '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25';

-- Phase 3: Recalculate course progress for affected users
WITH affected_users AS (
  SELECT DISTINCT user_id FROM orphaned_progress_backup 
  WHERE course_id = '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25'
),
course_stats AS (
  SELECT 
    au.user_id,
    '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25'::UUID as course_id,
    COUNT(DISTINCT u.id) as total_units,
    COUNT(DISTINCT CASE WHEN uup.completed = true THEN u.id END) as completed_units
  FROM affected_users au
  CROSS JOIN (
    SELECT u.id FROM units u
    JOIN lessons l ON u.section_id = l.id
    WHERE l.course_id = '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25'
    AND u.is_draft = false
  ) u
  LEFT JOIN user_unit_progress uup ON au.user_id = uup.user_id AND u.id = uup.unit_id
  GROUP BY au.user_id
)
UPDATE user_course_progress ucp
SET 
  progress_percentage = CASE 
    WHEN cs.total_units > 0 THEN LEAST(100, (cs.completed_units * 100) / cs.total_units)
    ELSE 0
  END,
  status = CASE
    WHEN cs.total_units > 0 AND cs.completed_units = cs.total_units THEN 'completed'
    WHEN cs.completed_units > 0 THEN 'in_progress'
    ELSE 'not_started'
  END,
  updated_at = now()
FROM course_stats cs
WHERE ucp.user_id = cs.user_id 
AND ucp.course_id = cs.course_id;

-- Phase 4: Log the cleanup operation
INSERT INTO user_management_audit (
  target_user_id,
  action_type,
  performed_by,
  reason,
  new_data
) 
SELECT 
  DISTINCT user_id,
  'orphaned_progress_cleanup',
  '018ee4c3-96c0-7a6c-ad5e-8e298970c4b7'::UUID, -- Using first affected user as performer
  'Automated cleanup of orphaned progress records from deleted Declarations lesson units',
  jsonb_build_object(
    'course_id', '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25',
    'cleanup_timestamp', now(),
    'backup_table', 'orphaned_progress_backup'
  )
FROM orphaned_progress_backup 
WHERE course_id = '018ee4c2-d9a8-7f2e-bdb8-ea2f0f2b9a25';