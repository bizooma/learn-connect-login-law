
-- Mark the TBD unit in Leadership Training-300 course as draft to hide it from display
UPDATE units 
SET is_draft = true, 
    updated_at = now()
WHERE id = 'f7b5e018-e9dc-496a-a51d-e2b4844a2a35'
  AND title = 'TBD';

-- Verify the unit is now marked as draft
SELECT 
  u.id,
  u.title,
  u.is_draft,
  l.title as lesson_title,
  c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE u.id = 'f7b5e018-e9dc-496a-a51d-e2b4844a2a35';
