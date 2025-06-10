
-- Update admin function to handle flexible user-course relationships
CREATE OR REPLACE FUNCTION public.admin_mark_unit_completed(
  p_user_id uuid,
  p_unit_id uuid,
  p_course_id uuid,
  p_reason text DEFAULT 'Administrative completion',
  p_performed_by uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_existing_progress RECORD;
  v_audit_id UUID;
  v_unit_exists BOOLEAN;
  v_user_enrolled BOOLEAN;
  v_unit_belongs_to_course BOOLEAN;
BEGIN
  -- Check if performer has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_performed_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can mark units as completed for other users';
  END IF;

  -- Validate unit exists and belongs to the course
  SELECT EXISTS(
    SELECT 1 FROM public.units u
    JOIN public.lessons l ON u.section_id = l.id
    WHERE u.id = p_unit_id AND l.course_id = p_course_id
  ) INTO v_unit_belongs_to_course;
  
  IF NOT v_unit_belongs_to_course THEN
    RAISE EXCEPTION 'Unit does not exist or does not belong to this course';
  END IF;

  -- Check if user exists
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- Check if user has course assignment OR course progress (flexible check)
  SELECT EXISTS(
    SELECT 1 FROM public.course_assignments 
    WHERE user_id = p_user_id AND course_id = p_course_id
    UNION
    SELECT 1 FROM public.user_course_progress 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO v_user_enrolled;

  -- If user is not enrolled, create the necessary records
  IF NOT v_user_enrolled THEN
    -- Create course assignment
    INSERT INTO public.course_assignments (
      user_id,
      course_id,
      assigned_by,
      assigned_at,
      notes
    ) VALUES (
      p_user_id,
      p_course_id,
      p_performed_by,
      now(),
      'Created automatically during admin unit completion override'
    );

    -- Create course progress
    INSERT INTO public.user_course_progress (
      user_id,
      course_id,
      status,
      progress_percentage,
      started_at,
      last_accessed_at
    ) VALUES (
      p_user_id,
      p_course_id,
      'in_progress',
      0,
      now(),
      now()
    );
  END IF;

  -- Get existing progress for backup
  SELECT * INTO v_existing_progress 
  FROM public.user_unit_progress 
  WHERE user_id = p_user_id AND unit_id = p_unit_id AND course_id = p_course_id;

  -- Create or update unit progress
  INSERT INTO public.user_unit_progress (
    user_id,
    unit_id,
    course_id,
    completed,
    completed_at,
    completion_method,
    updated_at
  )
  VALUES (
    p_user_id,
    p_unit_id,
    p_course_id,
    true,
    now(),
    'admin_override',
    now()
  )
  ON CONFLICT (user_id, unit_id, course_id) 
  DO UPDATE SET
    completed = true,
    completed_at = now(),
    completion_method = 'admin_override',
    updated_at = now();

  -- Log the action in user management audit
  INSERT INTO public.user_management_audit (
    target_user_id,
    action_type,
    performed_by,
    old_data,
    new_data,
    reason
  ) VALUES (
    p_user_id,
    'unit_completion_override',
    p_performed_by,
    CASE WHEN v_existing_progress.id IS NOT NULL 
         THEN row_to_json(v_existing_progress) 
         ELSE NULL END,
    jsonb_build_object(
      'unit_id', p_unit_id,
      'course_id', p_course_id,
      'completed', true,
      'completion_method', 'admin_override'
    ),
    p_reason
  ) RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'unit_id', p_unit_id,
    'course_id', p_course_id,
    'audit_id', v_audit_id,
    'message', 'Unit successfully marked as completed by admin'
  );
END;
$$;
