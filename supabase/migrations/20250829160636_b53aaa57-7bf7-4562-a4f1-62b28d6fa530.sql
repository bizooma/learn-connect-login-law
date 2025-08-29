
-- First, let's delete the three specific units from the Customer Service Training-100 course
DELETE FROM units 
WHERE id IN (
  '33202791-2869-4f0c-aa11-73f8ebbb203a',  -- Understanding the client journey
  '07faf292-2709-4042-bbfc-16a6291110d7',  -- Destination Outcome By Case Type
  '4f7c3535-6b25-4df0-b724-636852ede77a'   -- Destination Outcome by Case Type
);

-- Now let's reorder the remaining units in the "Intro to Immigration Law" lesson
-- to ensure proper sequential sort_order (0, 1, 2, 3, etc.)
WITH ordered_units AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY sort_order) - 1 AS new_sort_order
  FROM units 
  WHERE section_id = '6809f3ee-de08-40b0-8154-0d3365915182'  -- Intro to Immigration Law lesson
  ORDER BY sort_order
)
UPDATE units 
SET sort_order = ordered_units.new_sort_order,
    updated_at = now()
FROM ordered_units 
WHERE units.id = ordered_units.id;

-- Clean up any user progress data for the deleted units
DELETE FROM user_unit_progress 
WHERE unit_id IN (
  '33202791-2869-4f0c-aa11-73f8ebbb203a',
  '07faf292-2709-4042-bbfc-16a6291110d7', 
  '4f7c3535-6b25-4df0-b724-636852ede77a'
);

-- Clean up any video progress data for the deleted units  
DELETE FROM user_video_progress 
WHERE unit_id IN (
  '33202791-2869-4f0c-aa11-73f8ebbb203a',
  '07faf292-2709-4042-bbfc-16a6291110d7',
  '4f7c3535-6b25-4df0-b724-636852ede77a'
);
