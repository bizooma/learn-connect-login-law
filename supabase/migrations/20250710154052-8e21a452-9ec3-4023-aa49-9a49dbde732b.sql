-- Mark the two specific units as drafts to remove them from display
-- "How to Create the Transcript" and "Using Claude AI to Draft Addendums"

UPDATE units 
SET is_draft = true, updated_at = now()
WHERE id IN (
  '794bfb8b-5b75-4fe9-b679-e3fbe2eafa41', -- How to Create the Transcript
  '61b92c65-a72e-4c64-8772-e30118b4c369'  -- Using Claude AI to Draft Addendums
);

-- Verify the changes
SELECT u.id, u.title, u.is_draft, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE u.id IN (
  '794bfb8b-5b75-4fe9-b679-e3fbe2eafa41',
  '61b92c65-a72e-4c64-8772-e30118b4c369'
);