
-- Corrected migration: Move G-28 lesson to first position in Legal Training-200 course
-- First, shift all other lessons down by 1 to make room at position 0
UPDATE lessons 
SET sort_order = sort_order + 1,
    updated_at = now()
WHERE module_id = (
  SELECT m.id 
  FROM modules m 
  JOIN courses c ON m.course_id = c.id 
  WHERE c.title = 'Legal Training-200' 
  LIMIT 1
)
AND title != 'G-28';

-- Then move G-28 to position 0 (first)
UPDATE lessons 
SET sort_order = 0,
    updated_at = now()
WHERE module_id = (
  SELECT m.id 
  FROM modules m 
  JOIN courses c ON m.course_id = c.id 
  WHERE c.title = 'Legal Training-200' 
  LIMIT 1
)
AND title = 'G-28';

-- Verify the new order
SELECT 
  l.id,
  l.title,
  l.sort_order,
  c.title as course_title
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.title = 'Legal Training-200'
ORDER BY l.sort_order;
