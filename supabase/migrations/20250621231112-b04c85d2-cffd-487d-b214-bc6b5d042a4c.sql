
-- Step 1: Fix existing inconsistent records where quiz is completed but unit is not
-- This preserves all historical data while making it consistent

-- First, let's create a backup of current state for safety
CREATE TABLE IF NOT EXISTS completion_migration_backup AS 
SELECT 
  uup.*,
  'backup_' || now()::text as backup_timestamp
FROM user_unit_progress uup;

-- Fix units that have quiz completions but aren't marked as completed
UPDATE user_unit_progress 
SET 
  completed = true,
  completed_at = COALESCE(completed_at, quiz_completed_at, now()),
  completion_method = COALESCE(completion_method, 'migration_fix'),
  updated_at = now()
WHERE quiz_completed = true 
  AND completed = false 
  AND quiz_completed_at IS NOT NULL;

-- Fix units that have video completions but aren't marked as completed  
UPDATE user_unit_progress
SET 
  completed = true,
  completed_at = COALESCE(completed_at, video_completed_at, now()),
  completion_method = COALESCE(completion_method, 'migration_fix'),
  updated_at = now()
WHERE video_completed = true 
  AND completed = false 
  AND video_completed_at IS NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_unit_progress_completion_lookup 
ON user_unit_progress(user_id, course_id, completed);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_status 
ON user_course_progress(user_id, status, progress_percentage);

-- Create a function to reliably calculate course progress
CREATE OR REPLACE FUNCTION calculate_reliable_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS TABLE(total_units INTEGER, completed_units INTEGER, progress_percentage INTEGER, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_units INTEGER;
  v_completed_units INTEGER;
  v_progress_percentage INTEGER;
  v_status TEXT;
BEGIN
  -- Get total units in the course
  SELECT COUNT(DISTINCT u.id) INTO v_total_units
  FROM units u
  JOIN lessons l ON u.section_id = l.id
  WHERE l.course_id = p_course_id;
  
  -- Get completed units for this user
  SELECT COUNT(DISTINCT uup.unit_id) INTO v_completed_units
  FROM user_unit_progress uup
  JOIN units u ON uup.unit_id = u.id
  JOIN lessons l ON u.section_id = l.id
  WHERE uup.user_id = p_user_id 
    AND l.course_id = p_course_id
    AND uup.completed = true;
  
  -- Calculate progress percentage
  IF v_total_units > 0 THEN
    v_progress_percentage := ROUND((v_completed_units * 100.0) / v_total_units);
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  -- Determine status
  IF v_progress_percentage >= 100 THEN
    v_status := 'completed';
  ELSIF v_progress_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;
  
  RETURN QUERY SELECT v_total_units, v_completed_units, v_progress_percentage, v_status;
END;
$$;

-- Function to reliably mark a unit as complete
CREATE OR REPLACE FUNCTION mark_unit_complete_reliable(
  p_user_id UUID, 
  p_unit_id UUID, 
  p_course_id UUID,
  p_completion_method TEXT DEFAULT 'manual'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_progress RECORD;
BEGIN
  -- Only mark unit complete if unit_id is provided
  IF p_unit_id IS NOT NULL THEN
    -- Mark unit as complete (atomic operation)
    INSERT INTO user_unit_progress (
      user_id, unit_id, course_id, completed, completed_at, completion_method, updated_at
    )
    VALUES (
      p_user_id, p_unit_id, p_course_id, true, now(), p_completion_method, now()
    )
    ON CONFLICT (user_id, unit_id, course_id) 
    DO UPDATE SET
      completed = true,
      completed_at = COALESCE(user_unit_progress.completed_at, now()),
      completion_method = EXCLUDED.completion_method,
      updated_at = now()
    WHERE user_unit_progress.completed = false;
  END IF;
  
  -- Update course progress immediately
  SELECT * INTO v_course_progress 
  FROM calculate_reliable_course_progress(p_user_id, p_course_id);
  
  -- Update course progress record
  INSERT INTO user_course_progress (
    user_id, course_id, status, progress_percentage, 
    started_at, completed_at, last_accessed_at, updated_at
  )
  VALUES (
    p_user_id, p_course_id, v_course_progress.status, v_course_progress.progress_percentage,
    now(), 
    CASE WHEN v_course_progress.status = 'completed' THEN now() ELSE NULL END,
    now(), now()
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    completed_at = CASE 
      WHEN EXCLUDED.status = 'completed' AND user_course_progress.completed_at IS NULL 
      THEN now() 
      ELSE user_course_progress.completed_at 
    END,
    last_accessed_at = now(),
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Function to update course progress only (without unit completion)
CREATE OR REPLACE FUNCTION update_course_progress_reliable(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_progress RECORD;
BEGIN
  -- Calculate course progress
  SELECT * INTO v_course_progress 
  FROM calculate_reliable_course_progress(p_user_id, p_course_id);
  
  -- Update course progress record
  INSERT INTO user_course_progress (
    user_id, course_id, status, progress_percentage, 
    started_at, completed_at, last_accessed_at, updated_at
  )
  VALUES (
    p_user_id, p_course_id, v_course_progress.status, v_course_progress.progress_percentage,
    now(), 
    CASE WHEN v_course_progress.status = 'completed' THEN now() ELSE NULL END,
    now(), now()
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    progress_percentage = EXCLUDED.progress_percentage,
    completed_at = CASE 
      WHEN EXCLUDED.status = 'completed' AND user_course_progress.completed_at IS NULL 
      THEN now() 
      ELSE user_course_progress.completed_at 
    END,
    last_accessed_at = now(),
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Recalculate all course progress to fix existing inconsistencies
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT DISTINCT ucp.user_id, ucp.course_id
    FROM user_course_progress ucp
    JOIN profiles p ON ucp.user_id = p.id
    WHERE p.is_deleted = false
  LOOP
    PERFORM update_course_progress_reliable(rec.user_id, rec.course_id);
  END LOOP;
END $$;
