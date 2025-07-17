-- Remove the incorrect level from the Free 30 Day Immigration Law Training course
UPDATE courses 
SET level = NULL 
WHERE title ILIKE '%free 30 day immigration law training%' OR title ILIKE '%immigration law training%';