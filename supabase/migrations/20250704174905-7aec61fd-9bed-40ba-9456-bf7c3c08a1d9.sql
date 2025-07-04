-- Update the course title from "Legal - 100" to "Legal Training-100" to match naming convention
UPDATE courses 
SET title = 'Legal Training-100', updated_at = now()
WHERE title = 'Legal - 100' AND level = 'Legal-100';