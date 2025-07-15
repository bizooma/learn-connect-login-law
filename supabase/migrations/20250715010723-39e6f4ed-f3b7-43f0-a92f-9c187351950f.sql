-- Backup and delete the problematic unit causing duplicate key constraint errors

-- First backup any user progress data for this unit
INSERT INTO orphaned_progress_backup (user_id, unit_id, course_id, original_data, backup_type, original_table, reason)
SELECT user_id, unit_id, course_id, row_to_json(user_unit_progress.*), 'unit_deletion', 'user_unit_progress', 'Cleanup of problematic duplicate unit'
FROM user_unit_progress 
WHERE unit_id = 'bf2b21b9-06fe-4980-828f-e2aa4dd0fa80';

-- Delete user progress records that prevent unit deletion
DELETE FROM user_unit_progress WHERE unit_id = 'bf2b21b9-06fe-4980-828f-e2aa4dd0fa80';

-- Delete the problematic unit
DELETE FROM units 
WHERE id = 'bf2b21b9-06fe-4980-828f-e2aa4dd0fa80' 
  AND title = 'Screening for and Selling U Visas';