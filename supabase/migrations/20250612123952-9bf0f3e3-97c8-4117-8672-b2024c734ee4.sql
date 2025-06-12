
-- Safe reordering of units in "Intro to immigration Law" lesson (Legal-100 course)
-- Target lesson ID: cdef83e0-c965-4c54-8e80-7e0c4a96a8b4

-- First, verify current state for reference
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE l.id = 'cdef83e0-c965-4c54-8e80-7e0c4a96a8b4'
ORDER BY u.sort_order;

-- Update sort orders to match the requested sequence
-- Only targeting units that need repositioning
UPDATE units 
SET sort_order = CASE 
  WHEN title = 'Understanding the Contract and Scope of Representation' THEN 0
  WHEN title = 'Introduction to US Immigration Law' THEN 1
  WHEN title = 'Understanding US Immigration Law' THEN 2
  WHEN title = 'Understanding Immigration Terminology & Processes' THEN 3
  WHEN title = 'What is an A number' THEN 4
  WHEN title = 'Understanding voluntary departure & voluntary return' THEN 5
  WHEN title = 'What happened at the border' THEN 6
  WHEN title = 'Overview of Grounds of Inadmissability' THEN 7
  WHEN title = 'Red Flag: Visa overstays & USC child petitioners' THEN 8
  WHEN title = 'Unlawful presence bars' THEN 9
  ELSE sort_order
END,
updated_at = now()
WHERE section_id = 'cdef83e0-c965-4c54-8e80-7e0c4a96a8b4'
  AND title IN (
    'Understanding the Contract and Scope of Representation',
    'Introduction to US Immigration Law',
    'Understanding US Immigration Law',
    'Understanding Immigration Terminology & Processes',
    'What is an A number',
    'Understanding voluntary departure & voluntary return',
    'What happened at the border',
    'Overview of Grounds of Inadmissability',
    'Red Flag: Visa overstays & USC child petitioners',
    'Unlawful presence bars'
  );

-- Verify the final result matches the requested order
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE l.id = 'cdef83e0-c965-4c54-8e80-7e0c4a96a8b4'
ORDER BY u.sort_order;
