
-- Delete Lesson 4 "Intro to Systems" from Sales Training-100 course
-- This will delete the lesson and all its associated units, and reorder remaining lessons

-- First, let's identify and delete all units belonging to this lesson
DELETE FROM units 
WHERE section_id = '4df8536b-3071-40ad-878c-04130c59c5e5';

-- Delete the lesson itself
DELETE FROM lessons 
WHERE id = '4df8536b-3071-40ad-878c-04130c59c5e5'
  AND title = 'Intro to Systems';

-- Reorder the remaining lessons in the Sales Training-100 course module
-- Update sort_order for lessons that come after the deleted lesson
UPDATE lessons 
SET sort_order = sort_order - 1,
    updated_at = now()
WHERE module_id = (
  SELECT module_id FROM lessons 
  WHERE id = '4df8536b-3071-40ad-878c-04130c59c5e5'
  LIMIT 1
) 
AND sort_order > 3;

-- Verify the results
SELECT 
  l.id,
  l.title,
  l.sort_order,
  m.title as module_title,
  c.title as course_title,
  (SELECT COUNT(*) FROM units WHERE section_id = l.id) as unit_count
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.title = 'Sales Training-100'
ORDER BY l.sort_order;
