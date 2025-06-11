
-- Delete the units first (to maintain referential integrity)
DELETE FROM units WHERE id = 'a625a502-92ef-4811-8897-713907bb8458';
DELETE FROM units WHERE id = '8e5ff570-dad3-49e7-b96b-2e155cc4e78a';

-- Delete the lessons
DELETE FROM lessons WHERE id = '5f397304-db8a-4a94-92f6-9a5e65ec61e3';
DELETE FROM lessons WHERE id = '00398dfe-47b4-48fe-8af9-9aaa7a9e8d03';

-- Update sort orders for remaining lessons in the Sales Training-300 course
-- to ensure proper sequential ordering after deletion
UPDATE lessons 
SET sort_order = new_order.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order) as row_number
  FROM lessons 
  WHERE module_id = '6b3fa441-5d8c-4c8e-94e3-f4b8e3f6c123'
) as new_order
WHERE lessons.id = new_order.id;
