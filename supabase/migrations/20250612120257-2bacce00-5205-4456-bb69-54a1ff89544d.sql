
-- First, let's find the "Understanding the contract & scope of representation" unit
-- and check its current location
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, l.id as lesson_id, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE u.title ILIKE '%contract%scope%representation%'
   OR u.title ILIKE '%contract & scope%'
   OR u.title ILIKE '%Understanding the contract%';

-- Let's also check if there are any units with similar titles
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, l.id as lesson_id
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE c.title = 'Immigration Law-100'
  AND l.title = 'Introduction to Immigration Law'
ORDER BY u.sort_order;

-- Now let's identify the lesson ID for "Introduction to Immigration Law"
SELECT l.id as lesson_id, l.title, c.title as course_title
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.title = 'Immigration Law-100'
  AND l.title = 'Introduction to Immigration Law';

-- Check for the problematic units that need to be deleted
SELECT u.id, u.title, u.sort_order, l.title as lesson_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE u.title IN ('Our Philosophy on Evidence', 'Common Immigration Issues')
  AND c.title = 'Immigration Law-100';

-- Fix the sort order for the Introduction to Immigration Law lesson
-- First, let's get the lesson ID
WITH lesson_info AS (
  SELECT l.id as lesson_id
  FROM lessons l
  JOIN courses c ON l.course_id = c.id
  WHERE c.title = 'Immigration Law-100'
    AND l.title = 'Introduction to Immigration Law'
)
-- Update the sort orders for the correct sequence
UPDATE units 
SET sort_order = CASE 
  WHEN title = 'Understanding the contract & scope of representation' THEN 0
  WHEN title = 'Introduction to US Immigration Law' THEN 1
  WHEN title = 'Understanding US Immigration Law' THEN 2
  WHEN title = 'Immigration Law 101' THEN 3
  WHEN title = 'Overview of Immigration Law Terminology' THEN 4
  WHEN title = 'Overview of Grounds of Inadmissibility' THEN 5
  ELSE sort_order
END,
updated_at = now()
WHERE section_id = (SELECT lesson_id FROM lesson_info)
  AND title IN (
    'Understanding the contract & scope of representation',
    'Introduction to US Immigration Law',
    'Understanding US Immigration Law', 
    'Immigration Law 101',
    'Overview of Immigration Law Terminology',
    'Overview of Grounds of Inadmissibility'
  );

-- Delete the problematic units that were causing ordering issues
DELETE FROM units 
WHERE title IN ('Our Philosophy on Evidence', 'Common Immigration Issues')
  AND section_id IN (
    SELECT l.id 
    FROM lessons l 
    JOIN courses c ON l.course_id = c.id 
    WHERE c.title = 'Immigration Law-100'
  );

-- Verify the final result
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE c.title = 'Immigration Law-100'
  AND l.title = 'Introduction to Immigration Law'
ORDER BY u.sort_order;
