-- Direct fix for Julio's Legal Training-200 progress
UPDATE user_course_progress 
SET 
  progress_percentage = 96,
  status = 'in_progress',
  updated_at = NOW()
WHERE 
  user_id = (SELECT id FROM profiles WHERE LOWER(email) LIKE '%julio%' LIMIT 1)
  AND course_id = (SELECT id FROM courses WHERE LOWER(title) LIKE '%legal%' AND LOWER(title) LIKE '%200%' LIMIT 1);