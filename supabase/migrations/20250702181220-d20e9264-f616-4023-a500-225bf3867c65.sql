-- Fix the diagnose_progress_inconsistencies function to resolve the SQL alias error

CREATE OR REPLACE FUNCTION public.diagnose_progress_inconsistencies()
 RETURNS TABLE(total_users_with_progress integer, users_with_zero_progress integer, users_with_completed_units_but_zero_progress integer, sample_inconsistent_records jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_total_users INTEGER;
  v_zero_progress INTEGER;
  v_inconsistent INTEGER;
  v_sample JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can run diagnostics';
  END IF;

  -- Count total users with course progress
  SELECT COUNT(*) INTO v_total_users
  FROM public.user_course_progress ucp
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE p.is_deleted = false;
  
  -- Count users with zero progress
  SELECT COUNT(*) INTO v_zero_progress
  FROM public.user_course_progress ucp
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE ucp.progress_percentage = 0 AND p.is_deleted = false;
  
  -- Count users with completed units but zero progress
  SELECT COUNT(DISTINCT ucp.user_id) INTO v_inconsistent
  FROM public.user_course_progress ucp
  JOIN public.user_unit_progress uup ON ucp.user_id = uup.user_id AND ucp.course_id = uup.course_id
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE ucp.progress_percentage = 0 
    AND uup.completed = true 
    AND p.is_deleted = false;
  
  -- Get sample of inconsistent records (fixed subquery)
  WITH sample_data AS (
    SELECT 
      ucp.user_id,
      ucp.course_id,
      ucp.progress_percentage,
      p.email,
      COUNT(DISTINCT uup.unit_id) as completed_units_count
    FROM public.user_course_progress ucp
    JOIN public.user_unit_progress uup ON ucp.user_id = uup.user_id AND ucp.course_id = uup.course_id
    JOIN public.profiles p ON ucp.user_id = p.id
    WHERE ucp.progress_percentage = 0 
      AND uup.completed = true 
      AND p.is_deleted = false
    GROUP BY ucp.user_id, ucp.course_id, ucp.progress_percentage, p.email
    LIMIT 5
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_email', email,
      'course_id', course_id,
      'progress_percentage', progress_percentage,
      'completed_units', completed_units_count
    )
  ) INTO v_sample
  FROM sample_data;
  
  RETURN QUERY SELECT 
    v_total_users,
    v_zero_progress,
    v_inconsistent,
    v_sample;
END;
$function$;