
-- Corrected fix for the actual course and lesson containing the problematic units
-- Target: "Legal - 100" course, "Intro to immigration Law" lesson

-- First, let's verify the current state of units in the correct lesson
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE l.id = 'cdef83e0-c965-4c54-8e80-7e0c4a96a8b4'
ORDER BY u.sort_order;

-- Delete the two problematic units by their specific IDs
-- "Our Philosophy on Evidence" and "Common Immigration Issues"
DELETE FROM units 
WHERE id IN (
  'e70b47b4-6664-4319-81cd-9ebce7d12e8e',  -- Our Philosophy on Evidence
  '7153e673-38c3-4df7-8ce6-a370f8960b0e'   -- Common Immigration Issues
);

-- Update the sort orders for the remaining units in the "Intro to immigration Law" lesson
-- to ensure proper educational sequence
UPDATE units 
SET sort_order = CASE 
  WHEN title = 'Understanding the Contract and Scope of Representation' THEN 0
  WHEN title = 'US Law 101' THEN 1
  WHEN title = 'Immigration Law 101' THEN 2
  WHEN title = 'Overview of Immigration Terminology' THEN 3
  WHEN title = 'Overview of Grounds of Inadmissability' THEN 4
  ELSE sort_order
END,
updated_at = now()
WHERE section_id = 'cdef83e0-c965-4c54-8e80-7e0c4a96a8b4'
  AND title IN (
    'Understanding the Contract and Scope of Representation',
    'US Law 101',
    'Immigration Law 101',
    'Overview of Immigration Terminology',
    'Overview of Grounds of Inadmissability'
  );

-- Verify the final result after cleanup
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE l.id = 'cdef83e0-c965-4c54-8e80-7e0c4a96a8b4'
ORDER BY u.sort_order;
