-- Mark the two specific lessons as drafts to remove them from display
-- "How to Create the Transcript" and "Using Claude AI to Draft Addendums"

UPDATE lessons 
SET is_draft = true, updated_at = now()
WHERE course_id = '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48'
  AND (title LIKE '%How to Create the Transcript%' OR title LIKE '%Using Claude AI to Draft Addendums%');

-- Also mark any units in these lessons as drafts
UPDATE units 
SET is_draft = true, updated_at = now()
WHERE section_id IN (
  SELECT l.id 
  FROM lessons l 
  WHERE l.course_id = '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48'
    AND (l.title LIKE '%How to Create the Transcript%' OR l.title LIKE '%Using Claude AI to Draft Addendums%')
);

-- Verify the changes
SELECT l.id, l.title, l.is_draft, c.title as course_title
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.id = '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48'
  AND (l.title LIKE '%How to Create the Transcript%' OR l.title LIKE '%Using Claude AI to Draft Addendums%');