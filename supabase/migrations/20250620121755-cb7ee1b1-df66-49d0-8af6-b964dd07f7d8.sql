
-- Delete the "Intro to Systems" lesson from Customer Service Training-100 course
-- This will delete the lesson and all its associated units, and reorder remaining lessons

-- First, let's delete all units belonging to this lesson
DELETE FROM units 
WHERE section_id = 'ab1301bf-87d5-43fa-9522-8ffed7140aeb';

-- Delete the lesson itself
DELETE FROM lessons 
WHERE id = 'ab1301bf-87d5-43fa-9522-8ffed7140aeb'
  AND title = 'Intro to Systems';

-- Reorder the remaining lessons in the Customer Service Training-100 course module
-- Update sort_order for lessons that come after the deleted lesson (sort_order > 3)
UPDATE lessons 
SET sort_order = sort_order - 1,
    updated_at = now()
WHERE module_id = (
  SELECT module_id FROM lessons 
  WHERE id = '051c8ff2-8c4d-4c91-b817-e6d71f67f68b'
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
WHERE c.title = 'Customer Service Training-100'
ORDER BY l.sort_order;
