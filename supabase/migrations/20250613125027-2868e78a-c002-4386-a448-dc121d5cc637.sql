
-- Reorder units in "Introduction to Immigration Law" lesson (Sales Training-100 course)
-- Updated order with "Overview of Immigration Law Terminology" following "Determining Basic Eligibility by Case Type"

UPDATE units 
SET sort_order = CASE 
  WHEN title = 'Introduction to US Immigration Law' THEN 0
  WHEN title = 'Understanding US Immigration Law' THEN 1
  WHEN title = 'Immigration Law 101' THEN 2
  WHEN title = 'Destination Outcome by Case Type' THEN 3
  WHEN title = 'Determining Basic Eligibility by Case Type' THEN 4
  WHEN title = 'Overview of Immigration Law Terminology' THEN 5
  WHEN title = 'Understanding Immigration Terminology and Processes' THEN 6
  WHEN title = 'What is an A number' THEN 7
  WHEN title = 'Understanding Voluntary Departure & Voluntary Return' THEN 8
  WHEN title = 'What Happened at the Border' THEN 9
  WHEN title = 'Overview of Grounds of Inadmissibility' THEN 10
  WHEN title = 'Red Flags: Visa Overstays & USC Child Petitioners' THEN 11
  WHEN title = 'Unlawful Presence Bars' THEN 12
  ELSE sort_order
END,
updated_at = now()
WHERE section_id = (
  SELECT l.id 
  FROM lessons l 
  JOIN modules m ON l.module_id = m.id 
  JOIN courses c ON m.course_id = c.id 
  WHERE c.title = 'Sales Training-100' 
  AND l.title = 'Introduction to Immigration Law'
)
AND title IN (
  'Introduction to US Immigration Law',
  'Understanding US Immigration Law',
  'Immigration Law 101',
  'Destination Outcome by Case Type',
  'Determining Basic Eligibility by Case Type',
  'Overview of Immigration Law Terminology',
  'Understanding Immigration Terminology and Processes',
  'What is an A number',
  'Understanding Voluntary Departure & Voluntary Return',
  'What Happened at the Border',
  'Overview of Grounds of Inadmissibility',
  'Red Flags: Visa Overstays & USC Child Petitioners',
  'Unlawful Presence Bars'
);

-- Verify the final result
SELECT u.id, u.title, u.sort_order, l.title as lesson_title, c.title as course_title
FROM units u
JOIN lessons l ON u.section_id = l.id
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.title = 'Sales Training-100' 
  AND l.title = 'Introduction to Immigration Law'
ORDER BY u.sort_order;
