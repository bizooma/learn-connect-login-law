-- Safe Data Restoration for student@test.com using UPSERT approach
WITH student_info AS (
  SELECT id as user_id FROM profiles WHERE email = 'student@test.com'
),
admin_info AS (
  SELECT user_id as admin_id FROM user_roles WHERE role = 'admin' LIMIT 1
),
course_data AS (
  SELECT 
    uup.course_id,
    c.title as course_title,
    COUNT(uup.unit_id) as completed_units,
    MIN(uup.completed_at) as earliest_completion,
    MAX(uup.completed_at) as latest_completion,
    -- Calculate total units
    (SELECT COUNT(DISTINCT u.id) 
     FROM units u
     JOIN lessons l ON u.section_id = l.id
     WHERE l.course_id = uup.course_id AND u.is_draft = false) as total_units
  FROM user_unit_progress uup
  JOIN student_info si ON uup.user_id = si.user_id
  JOIN courses c ON c.id = uup.course_id
  WHERE uup.completed = true
  GROUP BY uup.course_id, c.title
),
course_calculations AS (
  SELECT 
    *,
    CASE 
      WHEN total_units > 0 THEN LEAST(100, (completed_units * 100) / total_units)
      ELSE 0 
    END as progress_percentage,
    CASE 
      WHEN total_units > 0 AND completed_units = total_units THEN 'completed'
      WHEN completed_units > 0 THEN 'in_progress'
      ELSE 'not_started'
    END as status
  FROM course_data
)
-- Insert course assignments
INSERT INTO course_assignments (
  user_id,
  course_id,
  assigned_by,
  assigned_at,
  notes,
  is_mandatory
)
SELECT 
  si.user_id,
  cc.course_id,
  ai.admin_id,
  cc.earliest_completion,
  'Restored assignment - lost during progress_recalculation_fix on 2024-06-11',
  false
FROM course_calculations cc, student_info si, admin_info ai
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Insert course progress
WITH student_info AS (
  SELECT id as user_id FROM profiles WHERE email = 'student@test.com'
),
course_data AS (
  SELECT 
    uup.course_id,
    c.title as course_title,
    COUNT(uup.unit_id) as completed_units,
    MIN(uup.completed_at) as earliest_completion,
    MAX(uup.completed_at) as latest_completion,
    -- Calculate total units
    (SELECT COUNT(DISTINCT u.id) 
     FROM units u
     JOIN lessons l ON u.section_id = l.id
     WHERE l.course_id = uup.course_id AND u.is_draft = false) as total_units
  FROM user_unit_progress uup
  JOIN student_info si ON uup.user_id = si.user_id
  JOIN courses c ON c.id = uup.course_id
  WHERE uup.completed = true
  GROUP BY uup.course_id, c.title
),
course_calculations AS (
  SELECT 
    *,
    CASE 
      WHEN total_units > 0 THEN LEAST(100, (completed_units * 100) / total_units)
      ELSE 0 
    END as progress_percentage,
    CASE 
      WHEN total_units > 0 AND completed_units = total_units THEN 'completed'
      WHEN completed_units > 0 THEN 'in_progress'
      ELSE 'not_started'
    END as status
  FROM course_data
)
INSERT INTO user_course_progress (
  user_id,
  course_id,
  status,
  progress_percentage,
  started_at,
  last_accessed_at,
  completed_at
)
SELECT 
  si.user_id,
  cc.course_id,
  cc.status,
  cc.progress_percentage,
  cc.earliest_completion,
  cc.latest_completion,
  CASE WHEN cc.status = 'completed' THEN cc.latest_completion ELSE NULL END
FROM course_calculations cc, student_info si
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Log the restoration
INSERT INTO user_management_audit (
  target_user_id,
  action_type,
  performed_by,
  reason,
  new_data
) 
SELECT 
  si.user_id,
  'data_restoration',
  ai.admin_id,
  'Restored missing course assignments and progress lost during progress_recalculation_fix',
  jsonb_build_object(
    'restoration_timestamp', now(),
    'courses_restored', 4,
    'affected_email', 'student@test.com'
  )
FROM (SELECT id as user_id FROM profiles WHERE email = 'student@test.com') si,
     (SELECT user_id as admin_id FROM user_roles WHERE role = 'admin' LIMIT 1) ai;