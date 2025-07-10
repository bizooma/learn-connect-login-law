-- Recalculate Julio's Legal Training-200 progress
DO $$
DECLARE
  julio_user_id UUID;
  legal_course_id UUID;
  total_units INTEGER;
  completed_units INTEGER;
  new_percentage INTEGER;
  new_status TEXT;
BEGIN
  -- Find Julio's user ID (assuming his email contains 'julio')
  SELECT id INTO julio_user_id 
  FROM profiles 
  WHERE LOWER(email) LIKE '%julio%' 
  LIMIT 1;
  
  -- Find Legal Training-200 course ID
  SELECT id INTO legal_course_id 
  FROM courses 
  WHERE LOWER(title) LIKE '%legal%' AND LOWER(title) LIKE '%200%'
  LIMIT 1;
  
  IF julio_user_id IS NULL OR legal_course_id IS NULL THEN
    RAISE NOTICE 'Could not find Julio or Legal 200 course';
    RETURN;
  END IF;
  
  -- Count total units in the course
  SELECT COUNT(DISTINCT u.id) INTO total_units
  FROM units u
  JOIN lessons l ON u.section_id = l.id
  WHERE l.course_id = legal_course_id;
  
  -- Count completed units for Julio
  SELECT COUNT(DISTINCT uup.unit_id) INTO completed_units
  FROM user_unit_progress uup
  JOIN units u ON uup.unit_id = u.id
  JOIN lessons l ON u.section_id = l.id
  WHERE uup.user_id = julio_user_id 
    AND l.course_id = legal_course_id
    AND uup.completed = true;
  
  -- Calculate new percentage and status
  new_percentage := CASE WHEN total_units > 0 THEN (completed_units * 100 / total_units) ELSE 0 END;
  new_status := CASE 
    WHEN new_percentage = 100 THEN 'completed'
    WHEN new_percentage > 0 THEN 'in_progress'
    ELSE 'not_started'
  END;
  
  -- Update course progress
  UPDATE user_course_progress
  SET 
    progress_percentage = new_percentage,
    status = new_status,
    completed_at = CASE WHEN new_percentage = 100 THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  WHERE user_id = julio_user_id AND course_id = legal_course_id;
  
  RAISE NOTICE 'Updated Julio progress: % percent complete (% of % units), status: %', 
    new_percentage, completed_units, total_units, new_status;
END $$;