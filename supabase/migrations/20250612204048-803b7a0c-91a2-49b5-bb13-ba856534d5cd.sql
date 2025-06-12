
-- Reorder units in Sales Training-100 course, lesson 1 to match the correct sequence
-- Target lesson: "Succeeding as a Sales Team Member" (lesson 1)

-- Update sort orders for units in the correct sequence
UPDATE units 
SET sort_order = CASE 
  WHEN title = 'Succeeding as a Sales Team Member' THEN 0
  WHEN title = '5 Characteristics of an Excellent Sales Team Member' THEN 1
  WHEN title = 'Succeeding as a Sales Supervisor' THEN 2
  WHEN title = '5 Characteristics of an Excellent Boss' THEN 3
  WHEN title = 'Understanding the Client Journey & Where You Fit In' THEN 4
  WHEN title = 'Meeting Clients Where They''re At' THEN 5
  WHEN title = 'Flow Chart of Client''s Journey (The Sales Cycle)' THEN 6
  WHEN title = 'Optimizing the Sales Funnel' THEN 7
  WHEN title = 'The importance of a hypothesis' THEN 8
  WHEN title = 'Bonus: 4 Steps to Delightful Delegation' THEN 9
  ELSE sort_order
END,
updated_at = now()
WHERE section_id = (
  SELECT l.id 
  FROM lessons l 
  JOIN modules m ON l.module_id = m.id 
  JOIN courses c ON m.course_id = c.id 
  WHERE c.title = 'Sales Training-100' 
  AND l.title = 'Succeeding as a Sales Team Member'
)
AND title IN (
  'Succeeding as a Sales Team Member',
  '5 Characteristics of an Excellent Sales Team Member',
  'Succeeding as a Sales Supervisor',
  '5 Characteristics of an Excellent Boss',
  'Understanding the Client Journey & Where You Fit In',
  'Meeting Clients Where They''re At',
  'Flow Chart of Client''s Journey (The Sales Cycle)',
  'Optimizing the Sales Funnel',
  'The importance of a hypothesis',
  'Bonus: 4 Steps to Delightful Delegation'
);

-- Verify the final result
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.title = 'Sales Training-100' 
  AND l.title = 'Succeeding as a Sales Team Member'
ORDER BY u.sort_order;
