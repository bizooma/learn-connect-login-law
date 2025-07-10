-- Clean up user_course_progress records that were created without proper course assignments
-- This migration removes progress records for users who are not actually assigned to those courses

-- Step 1: Backup the data we're about to delete (for safety)
CREATE TEMPORARY TABLE temp_orphaned_progress AS
SELECT ucp.*
FROM user_course_progress ucp
LEFT JOIN course_assignments ca ON ucp.user_id = ca.user_id AND ucp.course_id = ca.course_id
WHERE ca.id IS NULL;

-- Step 2: Delete orphaned progress records (progress without assignments)
DELETE FROM user_course_progress 
WHERE id IN (
  SELECT ucp.id
  FROM user_course_progress ucp
  LEFT JOIN course_assignments ca ON ucp.user_id = ca.user_id AND ucp.course_id = ca.course_id
  WHERE ca.id IS NULL
);

-- Optional: Log the cleanup operation
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deleted_count FROM temp_orphaned_progress;
  RAISE NOTICE 'Cleaned up % orphaned user_course_progress records', deleted_count;
END $$;