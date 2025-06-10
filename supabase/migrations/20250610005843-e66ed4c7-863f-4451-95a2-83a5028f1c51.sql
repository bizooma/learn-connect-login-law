
-- Permanently delete the two specific deleted quizzes that have no questions
DELETE FROM quizzes 
WHERE id IN (
  'd075a44c-ed87-41df-b5c3-3df5de7ea165', 
  '0241c0c1-b8c4-4d8c-a120-da1c0d4d9423'
) 
AND is_deleted = true;
