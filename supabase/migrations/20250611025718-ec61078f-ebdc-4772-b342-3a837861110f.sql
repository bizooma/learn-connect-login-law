
-- Fixed Progress Recalculation Migration - Corrected version
-- This preserves all manual admin work done today and only fixes remaining 0% progress issues

-- Step 1: Update the specific inconsistent records with calculated progress
WITH course_unit_counts AS (
  SELECT 
    l.course_id,
    COUNT(DISTINCT u.id) as total_units
  FROM lessons l
  JOIN units u ON u.section_id = l.id
  GROUP BY l.course_id
),
user_completed_units AS (
  SELECT 
    uup.user_id,
    uup.course_id,
    COUNT(DISTINCT uup.unit_id) as completed_units
  FROM user_unit_progress uup
  WHERE uup.completed = true
  GROUP BY uup.user_id, uup.course_id
),
inconsistent_records AS (
  SELECT 
    ucp.user_id,
    ucp.course_id,
    ucu.completed_units,
    cuc.total_units,
    CASE 
      WHEN cuc.total_units > 0 THEN LEAST(100, (ucu.completed_units * 100) / cuc.total_units)
      ELSE 0
    END as calculated_percentage,
    CASE 
      WHEN cuc.total_units > 0 AND ucu.completed_units >= cuc.total_units THEN 'completed'
      WHEN ucu.completed_units > 0 THEN 'in_progress'
      ELSE 'not_started'
    END as calculated_status,
    -- Create backup data for each record
    jsonb_build_object(
      'old_progress', ucp.progress_percentage,
      'old_status', ucp.status,
      'old_completed_at', ucp.completed_at,
      'completed_units', ucu.completed_units,
      'total_units', cuc.total_units,
      'migration_timestamp', now()
    ) as backup_data
  FROM user_course_progress ucp
  JOIN profiles p ON ucp.user_id = p.id
  JOIN user_completed_units ucu ON ucp.user_id = ucu.user_id AND ucp.course_id = ucu.course_id
  JOIN course_unit_counts cuc ON ucp.course_id = cuc.course_id
  WHERE 
    p.is_deleted = false
    AND ucu.completed_units > 0
    AND ucp.progress_percentage = 0
),
updated_records AS (
  UPDATE public.user_course_progress 
  SET 
    progress_percentage = ir.calculated_percentage,
    status = ir.calculated_status,
    updated_at = now(),
    last_accessed_at = now(),
    completed_at = CASE 
      WHEN ir.calculated_status = 'completed' AND completed_at IS NULL 
      THEN now() 
      ELSE completed_at 
    END
  FROM inconsistent_records ir
  WHERE 
    user_course_progress.user_id = ir.user_id 
    AND user_course_progress.course_id = ir.course_id
  RETURNING user_course_progress.user_id, user_course_progress.course_id, ir.backup_data
)
-- Step 2: Create audit records for each updated user
INSERT INTO public.user_management_audit (
  target_user_id,
  action_type,
  performed_by,
  reason,
  old_data,
  new_data
)
SELECT 
  ur.user_id,
  'progress_recalculation_fix',
  ur.user_id, -- Use the target user as performer since this is system migration
  'Automated fix for progress inconsistencies after manual admin updates',
  ur.backup_data,
  jsonb_build_object(
    'new_progress', ucp.progress_percentage,
    'new_status', ucp.status,
    'migration_type', 'refined_fix',
    'updated_at', now()
  )
FROM updated_records ur
JOIN user_course_progress ucp ON ur.user_id = ucp.user_id AND ur.course_id = ucp.course_id;

-- Step 3: Verification query to confirm the fix worked
-- This will show any remaining inconsistencies (should be 0)
WITH course_unit_counts AS (
  SELECT 
    l.course_id,
    COUNT(DISTINCT u.id) as total_units
  FROM lessons l
  JOIN units u ON u.section_id = l.id
  GROUP BY l.course_id
),
user_completed_units AS (
  SELECT 
    uup.user_id,
    uup.course_id,
    COUNT(DISTINCT uup.unit_id) as completed_units
  FROM user_unit_progress uup
  WHERE uup.completed = true
  GROUP BY uup.user_id, uup.course_id
),
remaining_inconsistencies AS (
  SELECT 
    ucp.user_id,
    ucp.course_id,
    p.email,
    ucp.progress_percentage,
    ucp.status,
    ucu.completed_units,
    cuc.total_units
  FROM user_course_progress ucp
  JOIN profiles p ON ucp.user_id = p.id
  JOIN user_completed_units ucu ON ucp.user_id = ucu.user_id AND ucp.course_id = ucu.course_id
  JOIN course_unit_counts cuc ON ucp.course_id = cuc.course_id
  WHERE 
    p.is_deleted = false
    AND ucu.completed_units > 0
    AND ucp.progress_percentage = 0
)
SELECT 
  COUNT(*) as remaining_inconsistent_records,
  COUNT(DISTINCT user_id) as affected_users,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All inconsistencies resolved!'
    ELSE 'WARNING: ' || COUNT(*) || ' records still need attention'
  END as status_message
FROM remaining_inconsistencies;
