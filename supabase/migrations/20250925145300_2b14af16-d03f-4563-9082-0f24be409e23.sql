-- PHASE 3: Create automatic curriculum expansion prevention system
CREATE OR REPLACE FUNCTION public.handle_curriculum_expansion()
RETURNS TRIGGER AS $$
DECLARE
  v_affected_users_count INTEGER := 0;
  v_lesson_id UUID;
  v_course_id UUID;
  rec RECORD;
BEGIN
  -- Get lesson and course info for the new unit
  SELECT l.id, l.course_id INTO v_lesson_id, v_course_id
  FROM lessons l
  WHERE l.id = NEW.section_id;
  
  -- Log the curriculum change
  INSERT INTO public.curriculum_change_audit (
    lesson_id,
    change_type,
    unit_id,
    changed_by,
    reason,
    metadata
  ) VALUES (
    v_lesson_id,
    'unit_added',
    NEW.id,
    auth.uid(),
    'New unit added to existing lesson',
    jsonb_build_object(
      'unit_title', NEW.title,
      'lesson_id', v_lesson_id,
      'course_id', v_course_id
    )
  );
  
  -- Auto-grandfather users who completed the lesson before this unit was added
  -- Find users who have completed other units in this lesson
  FOR rec IN 
    SELECT DISTINCT 
      uup.user_id,
      p.email,
      COUNT(*) as completed_units_in_lesson
    FROM user_unit_progress uup
    JOIN units u ON uup.unit_id = u.id
    JOIN profiles p ON uup.user_id = p.id
    WHERE u.section_id = v_lesson_id
      AND uup.completed = true
      AND u.id != NEW.id  -- Exclude the new unit
      AND uup.completed_at < NEW.created_at  -- Completed before new unit was added
    GROUP BY uup.user_id, p.email
    HAVING COUNT(*) >= 3  -- Had completed at least 3 units in the lesson
  LOOP
    -- Auto-complete the new unit for users who had substantial progress
    INSERT INTO public.user_unit_progress (
      user_id,
      unit_id,
      course_id,
      completed,
      completed_at,
      completion_method,
      completion_curriculum_version
    ) VALUES (
      rec.user_id,
      NEW.id,
      v_course_id,
      true,
      NEW.created_at,
      'auto_grandfathered_curriculum_expansion',
      1  -- Original curriculum version
    )
    ON CONFLICT (user_id, unit_id, course_id) DO NOTHING;
    
    -- Recalculate course progress for this user
    PERFORM public.update_course_progress_reliable(rec.user_id, v_course_id);
    
    v_affected_users_count := v_affected_users_count + 1;
  END LOOP;
  
  -- Update the audit record with affected users count
  UPDATE public.curriculum_change_audit
  SET affected_users_count = v_affected_users_count,
      auto_grandfathered = (v_affected_users_count > 0)
  WHERE lesson_id = v_lesson_id 
    AND unit_id = NEW.id 
    AND change_type = 'unit_added';
  
  -- Update lesson curriculum version
  UPDATE public.lessons
  SET curriculum_version = curriculum_version + 1,
      last_content_update = now()
  WHERE id = v_lesson_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for curriculum expansion
DROP TRIGGER IF EXISTS trigger_curriculum_expansion ON public.units;
CREATE TRIGGER trigger_curriculum_expansion
  AFTER INSERT ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_curriculum_expansion();

-- PHASE 4: Enhanced progress calculation that respects curriculum versions
CREATE OR REPLACE FUNCTION public.update_course_progress_enhanced(p_user_id uuid, p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_units INTEGER := 0;
  v_completed_units INTEGER := 0;
  v_calculated_percentage INTEGER := 0;
  v_calculated_status TEXT := 'not_started';
  v_old_progress RECORD;
  v_should_update BOOLEAN := false;
  v_debug_info TEXT := '';
  v_user_first_completion DATE;
BEGIN
  -- Get current progress for comparison and backup
  SELECT * INTO v_old_progress 
  FROM user_course_progress 
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Get user's first completion date in this course to determine curriculum version context
  SELECT MIN(DATE(completed_at)) INTO v_user_first_completion
  FROM user_unit_progress uup
  JOIN units u ON uup.unit_id = u.id
  JOIN lessons l ON u.section_id = l.id
  WHERE uup.user_id = p_user_id 
    AND l.course_id = p_course_id 
    AND uup.completed = true;
  
  -- Count total units for this course, considering curriculum version if user has early completions
  IF v_user_first_completion IS NOT NULL AND v_user_first_completion < '2025-06-25' THEN
    -- For users who started before June 25, 2025, exclude units added after their first completion
    SELECT COUNT(DISTINCT u.id)
    INTO v_total_units
    FROM public.units u
    JOIN public.lessons l ON u.section_id = l.id
    WHERE l.course_id = p_course_id
      AND (u.created_at <= (v_user_first_completion + interval '30 days') OR 
           EXISTS (SELECT 1 FROM user_unit_progress uup2 
                   WHERE uup2.user_id = p_user_id AND uup2.unit_id = u.id AND uup2.completed = true));
  ELSE
    -- For new users, count all current units
    SELECT COUNT(DISTINCT u.id)
    INTO v_total_units
    FROM public.units u
    JOIN public.lessons l ON u.section_id = l.id  
    WHERE l.course_id = p_course_id;
  END IF;
  
  -- Count completed units for this user and course
  SELECT COUNT(DISTINCT u.id)
  INTO v_completed_units  
  FROM public.units u
  JOIN public.lessons l ON u.section_id = l.id
  WHERE l.course_id = p_course_id
    AND EXISTS (
      SELECT 1 FROM public.user_unit_progress uup 
      WHERE uup.user_id = p_user_id 
        AND uup.course_id = p_course_id 
        AND uup.unit_id = u.id
        AND uup.completed = true
    );

  -- Calculate percentage and status
  IF v_total_units > 0 THEN 
    v_calculated_percentage := LEAST(100, (v_completed_units * 100) / v_total_units);
  ELSE 
    v_calculated_percentage := 0;
  END IF;
  
  IF v_total_units > 0 AND (v_completed_units * 100) / v_total_units = 100 THEN
    v_calculated_status := 'completed';
  ELSIF v_completed_units > 0 THEN
    v_calculated_status := 'in_progress';
  ELSE
    v_calculated_status := 'not_started';
  END IF;

  -- Build debug info
  v_debug_info := 'Enhanced calculation: ' || v_calculated_percentage || '% (' || v_completed_units || '/' || v_total_units || ' units)';
  IF v_user_first_completion IS NOT NULL THEN
    v_debug_info := v_debug_info || ' | First completion: ' || v_user_first_completion;
  END IF;
  
  -- Progress protection logic: only update if it's genuinely better or first time
  IF v_old_progress.id IS NULL THEN
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Creating new progress record';
  ELSIF v_calculated_percentage > v_old_progress.progress_percentage THEN
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Progress increased from ' || v_old_progress.progress_percentage || '%';
  ELSIF v_calculated_percentage = v_old_progress.progress_percentage AND v_calculated_status != v_old_progress.status THEN
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Status changed from ' || v_old_progress.status || ' to ' || v_calculated_status;
  ELSE
    v_debug_info := v_debug_info || ' | Preserving existing progress: ' || v_old_progress.progress_percentage || '%';
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
    'debug_info', v_debug_info,
    'curriculum_aware', true
  );
END;
$$;