-- Recalculate progress percentages for restored student data
UPDATE user_course_progress 
SET 
  progress_percentage = CASE 
    WHEN total_units.count > 0 THEN 
      LEAST(100, (completed_units.count * 100) / total_units.count)
    ELSE 0 
  END,
  status = CASE 
    WHEN total_units.count > 0 AND completed_units.count = total_units.count THEN 'completed'
    WHEN completed_units.count > 0 THEN 'in_progress'
    ELSE 'not_started'
  END,
  updated_at = now()
FROM (
  -- Count total units per course
  SELECT 
    l.course_id,
    COUNT(DISTINCT u.id) as count
  FROM units u
  JOIN lessons l ON u.section_id = l.id
  WHERE u.is_draft = false
  GROUP BY l.course_id
) total_units,
(
  -- Count completed units per user per course
  SELECT 
    uup.user_id,
    uup.course_id,
    COUNT(DISTINCT uup.unit_id) as count
  FROM user_unit_progress uup
  WHERE uup.completed = true
  GROUP BY uup.user_id, uup.course_id
) completed_units
WHERE user_course_progress.user_id = (SELECT id FROM profiles WHERE email = 'student@test.com')
AND user_course_progress.course_id = total_units.course_id
AND user_course_progress.user_id = completed_units.user_id
AND user_course_progress.course_id = completed_units.course_id;