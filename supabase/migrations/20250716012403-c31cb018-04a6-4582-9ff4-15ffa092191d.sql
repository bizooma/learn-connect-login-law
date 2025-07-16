-- Fix the update_course_progress_reliable function to match the working bulk calculation logic
-- and add protection against downgrading progress

DROP FUNCTION IF EXISTS public.update_course_progress_reliable(UUID, UUID);

-- Enhanced function with protection against progress downgrades
CREATE OR REPLACE FUNCTION public.update_course_progress_reliable(
  p_user_id UUID,
  p_course_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_units INTEGER := 0;
  v_completed_units INTEGER := 0;
  v_calculated_percentage INTEGER := 0;
  v_calculated_status TEXT := 'not_started';
  v_old_progress RECORD;
  v_should_update BOOLEAN := false;
  v_debug_info TEXT := '';
BEGIN
  -- Get current progress for comparison and backup
  SELECT * INTO v_old_progress 
  FROM user_course_progress 
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Use the SAME calculation logic as bulk_recalculate_course_progress
  -- This ensures consistency between functions
  SELECT 
    COUNT(DISTINCT u.id) as total_units_in_course,
    COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) as actual_completed_units,
    CASE 
      WHEN COUNT(DISTINCT u.id) > 0 THEN 
        LEAST(100, (COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) * 100) / COUNT(DISTINCT u.id))
      ELSE 0 
    END as calculated_percentage,
    CASE 
      WHEN COUNT(DISTINCT u.id) > 0 AND 
           (COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) * 100) / COUNT(DISTINCT u.id) = 100 
      THEN 'completed'
      WHEN COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) > 0 
      THEN 'in_progress'
      ELSE 'not_started'
    END as calculated_status
  INTO v_total_units, v_completed_units, v_calculated_percentage, v_calculated_status
  FROM 
    public.units u 
  WHERE EXISTS (
    SELECT 1 FROM public.lessons l 
    WHERE l.id = u.section_id AND l.course_id = p_course_id
  )
  LEFT JOIN 
    public.user_unit_progress uup ON uup.user_id = p_user_id 
    AND uup.course_id = p_course_id 
    AND uup.unit_id = u.id;

  -- Build debug info
  v_debug_info := 'Calculated: ' || v_calculated_percentage || '% (' || v_completed_units || '/' || v_total_units || ' units)';
  
  -- Progress protection logic: only update if it's genuinely better or first time
  IF v_old_progress.id IS NULL THEN
    -- No existing progress record - create new one
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Creating new progress record';
  ELSIF v_calculated_percentage > v_old_progress.progress_percentage THEN
    -- Progress increased - always update
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Progress increased from ' || v_old_progress.progress_percentage || '%';
  ELSIF v_calculated_percentage = v_old_progress.progress_percentage AND v_calculated_status != v_old_progress.status THEN
    -- Same percentage but status changed (e.g., completed_at timestamp)
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Status changed from ' || v_old_progress.status || ' to ' || v_calculated_status;
  ELSE
    -- Would downgrade progress - don't update unless it's a significant discrepancy
    IF ABS(v_calculated_percentage - v_old_progress.progress_percentage) > 10 THEN
      -- Large discrepancy suggests data issue - log but don't auto-fix
      v_debug_info := v_debug_info || ' | WARNING: Large discrepancy detected but not auto-fixing. Stored: ' || v_old_progress.progress_percentage || '%';
    ELSE
      -- Small discrepancy - preserve existing progress
      v_debug_info := v_debug_info || ' | Preserving existing progress: ' || v_old_progress.progress_percentage || '%';
    END IF;
    v_should_update := false;
  END IF;

  -- Only update if we determined it's safe and beneficial
  IF v_should_update THEN
    INSERT INTO user_course_progress (
      user_id, course_id, progress_percentage, status, 
      started_at, completed_at, last_accessed_at
    ) VALUES (
      p_user_id, p_course_id, v_calculated_percentage, v_calculated_status,
      COALESCE(v_old_progress.started_at, now()),
      CASE WHEN v_calculated_status = 'completed' THEN COALESCE(v_old_progress.completed_at, now()) ELSE v_old_progress.completed_at END,
      now()
    )
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      progress_percentage = EXCLUDED.progress_percentage,
      status = EXCLUDED.status,
      completed_at = CASE 
        WHEN EXCLUDED.status = 'completed' AND user_course_progress.completed_at IS NULL 
        THEN now() 
        ELSE user_course_progress.completed_at 
      END,
      last_accessed_at = EXCLUDED.last_accessed_at,
      updated_at = now();
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated', v_should_update,
    'progress_percentage', COALESCE(v_old_progress.progress_percentage, v_calculated_percentage),
    'calculated_percentage', v_calculated_percentage,
    'status', COALESCE(v_old_progress.status, v_calculated_status),
    'calculated_status', v_calculated_status,
    'total_units', v_total_units,
    'completed_units', v_completed_units,
    'debug_info', v_debug_info
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_course_progress_reliable(UUID, UUID) TO authenticated;