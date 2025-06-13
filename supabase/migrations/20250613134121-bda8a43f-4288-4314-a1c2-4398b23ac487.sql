
-- Hide the "Mastering the I-130" unit from course display by marking it as draft
-- This preserves the data while removing it from the course page

UPDATE units 
SET is_draft = true, 
    updated_at = now()
WHERE id = '2c719ad1-b202-4bea-af6d-8c9022a8bb06'
  AND title = 'Mastering the I-130';

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
WHERE u.id = '2c719ad1-b202-4bea-af6d-8c9022a8bb06';
