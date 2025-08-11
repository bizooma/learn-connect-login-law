-- Security hardening: set stable search_path for functions without it

-- 1) backup_quiz_data
CREATE OR REPLACE FUNCTION public.backup_quiz_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the operation in audit table
  INSERT INTO quiz_audit_log (
    table_name, 
    record_id, 
    operation, 
    old_data, 
    new_data, 
    user_id
  ) VALUES (
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

-- 2) create_admin_team
CREATE OR REPLACE FUNCTION public.create_admin_team(p_name text, p_description text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_team_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create teams';
  END IF;

  INSERT INTO public.admin_teams (name, description, created_by)
  VALUES (p_name, p_description, auth.uid())
  RETURNING id INTO v_team_id;

  RETURN v_team_id;
END;
$function$;

-- 3) recalculate_law_firm_seat_counts
CREATE OR REPLACE FUNCTION public.recalculate_law_firm_seat_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE law_firms 
  SET used_seats = (
    SELECT COUNT(*) 
    FROM profiles 
    WHERE profiles.law_firm_id = law_firms.id 
      AND profiles.is_deleted = false
  );
END;
$function$;

-- 4) restore_quiz
CREATE OR REPLACE FUNCTION public.restore_quiz(quiz_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can restore quizzes';
  END IF;

  -- Restore the quiz and related data
  UPDATE quizzes 
  SET deleted_at = NULL, is_deleted = false, updated_at = now()
  WHERE id = quiz_id AND is_deleted = true;

  UPDATE quiz_questions 
  SET deleted_at = NULL, is_deleted = false, updated_at = now()
  WHERE quiz_id = quiz_id AND is_deleted = true;

  UPDATE quiz_question_options 
  SET deleted_at = NULL, is_deleted = false
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_id = quiz_id
  ) AND is_deleted = true;

  RETURN FOUND;
END;
$function$;

-- 5) reclassify_section_to_module
CREATE OR REPLACE FUNCTION public.reclassify_section_to_module(p_section_id uuid, p_course_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_module_id UUID;
  v_section_record RECORD;
BEGIN
  -- Get the lesson details (formerly section)
  SELECT * INTO v_section_record FROM lessons WHERE id = p_section_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;
  
  -- Create a new module with lesson's details
  INSERT INTO modules (
    course_id,
    title,
    description,
    image_url,
    sort_order
  ) VALUES (
    p_course_id,
    v_section_record.title,
    v_section_record.description,
    v_section_record.image_url,
    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM modules WHERE course_id = p_course_id)
  ) RETURNING id INTO v_module_id;
  
  -- Update all units that belonged to this lesson to belong to a new lesson in the new module
  WITH new_lesson AS (
    INSERT INTO lessons (
      course_id,
      module_id,
      title,
      description,
      sort_order
    ) VALUES (
      p_course_id,
      v_module_id,
      'Content',
      'Reclassified content',
      0
    ) RETURNING id
  )
  UPDATE units 
  SET section_id = (SELECT id FROM new_lesson)
  WHERE section_id = p_section_id;
  
  -- Delete the original lesson
  DELETE FROM lessons WHERE id = p_section_id;
  
  RETURN v_module_id;
END;
$function$;

-- 6) move_content_to_level
CREATE OR REPLACE FUNCTION public.move_content_to_level(p_content_id uuid, p_content_type text, p_target_parent_id uuid, p_target_parent_type text, p_new_sort_order integer DEFAULT NULL::integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_course_id UUID;
  v_module_id UUID;
  v_section_id UUID;
  v_sort_order INTEGER;
BEGIN
  -- Determine the target hierarchy context
  CASE p_target_parent_type
    WHEN 'course' THEN
      v_course_id := p_target_parent_id;
      -- If moving to course level, we need to find or create a default module
      SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title = 'Main Module' LIMIT 1;
      
    WHEN 'module' THEN
      v_module_id := p_target_parent_id;
      SELECT course_id INTO v_course_id FROM modules WHERE id = v_module_id;
      
    WHEN 'section' THEN
      v_section_id := p_target_parent_id;
      SELECT course_id, module_id INTO v_course_id, v_module_id FROM lessons WHERE id = v_section_id;
      
    ELSE
      RAISE EXCEPTION 'Invalid target parent type';
  END CASE;
  
  -- Calculate sort order if not provided
  v_sort_order := COALESCE(p_new_sort_order, 0);
  
  -- Update the content based on type
  CASE p_content_type
    WHEN 'section' THEN
      UPDATE lessons 
      SET course_id = v_course_id, 
          module_id = v_module_id,
          sort_order = v_sort_order
      WHERE id = p_content_id;
      
    WHEN 'unit' THEN
      -- For units, we need a lesson context
      IF v_section_id IS NULL THEN
        RAISE EXCEPTION 'Units must be moved to a lesson';
      END IF;
      
      UPDATE units 
      SET section_id = v_section_id,
          sort_order = v_sort_order
      WHERE id = p_content_id;
      
    ELSE
      RAISE EXCEPTION 'Invalid content type';
  END CASE;
  
  RETURN TRUE;
END;
$function$;

-- 7) soft_delete_quiz
CREATE OR REPLACE FUNCTION public.soft_delete_quiz(quiz_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete quizzes';
  END IF;

  -- Soft delete the quiz and related data
  UPDATE quizzes 
  SET deleted_at = now(), is_deleted = true, updated_at = now()
  WHERE id = quiz_id AND is_deleted = false;

  UPDATE quiz_questions 
  SET deleted_at = now(), is_deleted = true, updated_at = now()
  WHERE quiz_questions.quiz_id = soft_delete_quiz.quiz_id AND is_deleted = false;

  UPDATE quiz_question_options 
  SET deleted_at = now(), is_deleted = true
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_questions.quiz_id = soft_delete_quiz.quiz_id
  ) AND is_deleted = false;

  RETURN FOUND;
END;
$function$;

-- 8) reclassify_unit_to_section
CREATE OR REPLACE FUNCTION public.reclassify_unit_to_section(p_unit_id uuid, p_module_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_section_id UUID;
  v_unit_title TEXT;
  v_unit_description TEXT;
  v_course_id UUID;
BEGIN
  -- Get the unit details and course_id separately
  SELECT u.title, u.description INTO v_unit_title, v_unit_description
  FROM units u 
  WHERE u.id = p_unit_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit not found';
  END IF;
  
  -- Get the course_id
  SELECT s.course_id INTO v_course_id
  FROM units u 
  JOIN lessons s ON u.section_id = s.id 
  WHERE u.id = p_unit_id;
  
  -- Create a new lesson with unit's details
  INSERT INTO lessons (
    course_id,
    module_id,
    title,
    description,
    sort_order
  ) VALUES (
    v_course_id,
    p_module_id,
    v_unit_title,
    v_unit_description,
    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM lessons WHERE module_id = p_module_id)
  ) RETURNING id INTO v_section_id;
  
  -- Delete the original unit (content will be lost, but this is intentional for reclassification)
  DELETE FROM units WHERE id = p_unit_id;
  
  RETURN v_section_id;
END;
$function$;

-- 9) safe_unit_upsert
CREATE OR REPLACE FUNCTION public.safe_unit_upsert(p_unit_id uuid, p_section_id uuid, p_title text, p_description text, p_content text, p_video_url text, p_duration_minutes integer, p_sort_order integer, p_file_url text DEFAULT NULL::text, p_file_name text DEFAULT NULL::text, p_file_size bigint DEFAULT NULL::bigint, p_files jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_result_id UUID;
    v_conflict_title TEXT;
BEGIN
    -- Check for title conflicts in the same section
    SELECT title INTO v_conflict_title 
    FROM units 
    WHERE title = p_title 
      AND section_id = p_section_id 
      AND (p_unit_id IS NULL OR id != p_unit_id)
    LIMIT 1;
    
    -- If there's a conflict, append a suffix
    IF v_conflict_title IS NOT NULL THEN
        p_title := p_title || ' (Updated)';
    END IF;
    
    -- Perform the upsert
    INSERT INTO units (
        id, section_id, title, description, content, video_url, 
        duration_minutes, sort_order, file_url, file_name, file_size, files
    ) VALUES (
        COALESCE(p_unit_id, gen_random_uuid()), p_section_id, p_title, p_description, 
        p_content, p_video_url, p_duration_minutes, p_sort_order, 
        p_file_url, p_file_name, p_file_size, p_files
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        content = EXCLUDED.content,
        video_url = EXCLUDED.video_url,
        duration_minutes = EXCLUDED.duration_minutes,
        sort_order = EXCLUDED.sort_order,
        file_url = EXCLUDED.file_url,
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        files = EXCLUDED.files,
        updated_at = now()
    RETURNING id INTO v_result_id;
    
    RETURN v_result_id;
END;
$function$;

-- 10) audit_unit_changes
CREATE OR REPLACE FUNCTION public.audit_unit_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Check for potential duplicates on insert
    IF EXISTS (
      SELECT 1 FROM units 
      WHERE title = NEW.title 
      AND section_id = NEW.section_id 
      AND id != NEW.id
    ) THEN
      RAISE WARNING 'Potential duplicate unit detected: % in section %', NEW.title, NEW.section_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- 11) update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 12) add_team_member
CREATE OR REPLACE FUNCTION public.add_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can add team members';
  END IF;

  -- Check if team exists
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_teams WHERE id = p_team_id
  ) THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Check if user exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_deleted = false
  ) THEN
    RAISE EXCEPTION 'User not found or is deleted';
  END IF;

  INSERT INTO public.admin_team_members (team_id, user_id, added_by)
  VALUES (p_team_id, p_user_id, auth.uid())
  ON CONFLICT (team_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$function$;

-- 13) remove_team_member
CREATE OR REPLACE FUNCTION public.remove_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can remove team members';
  END IF;

  DELETE FROM public.admin_team_members 
  WHERE team_id = p_team_id AND user_id = p_user_id;

  RETURN TRUE;
END;
$function$;

-- 14) get_team_progress_summary
CREATE OR REPLACE FUNCTION public.get_team_progress_summary(p_team_id uuid)
RETURNS TABLE(total_members integer, courses_in_progress integer, courses_completed integer, average_progress numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view team progress';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(DISTINCT atm.user_id)::INTEGER as total_members,
    COUNT(CASE WHEN ucp.status = 'in_progress' THEN 1 END)::INTEGER as courses_in_progress,
    COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END)::INTEGER as courses_completed,
    COALESCE(AVG(ucp.progress_percentage), 0)::NUMERIC as average_progress
  FROM public.admin_team_members atm
  LEFT JOIN public.user_course_progress ucp ON atm.user_id = ucp.user_id
  WHERE atm.team_id = p_team_id;
END;
$function$;

-- 15) start_user_session
CREATE OR REPLACE FUNCTION public.start_user_session(p_user_id uuid, p_course_id uuid DEFAULT NULL::uuid, p_session_type text DEFAULT 'general'::text, p_entry_point text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id UUID;
BEGIN
  -- Insert new session
  INSERT INTO public.user_sessions (
    user_id,
    course_id,
    session_type,
    entry_point,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_course_id,
    p_session_type,
    p_entry_point,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_session_id;

  -- Log the session start activity
  PERFORM public.log_user_activity(
    p_user_id,
    CASE 
      WHEN p_course_id IS NOT NULL THEN 'course_enter'::activity_type
      ELSE 'login'::activity_type
    END,
    p_course_id,
    NULL, -- unit_id
    NULL, -- quiz_id
    v_session_id::TEXT, -- session_id
    NULL, -- duration_seconds
    jsonb_build_object('session_type', p_session_type, 'entry_point', p_entry_point),
    p_ip_address,
    p_user_agent
  );

  RETURN v_session_id;
END;
$function$;

-- 16) end_user_session
CREATE OR REPLACE FUNCTION public.end_user_session(p_session_id uuid, p_exit_point text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session RECORD;
  v_duration INTEGER;
BEGIN
  -- Get session details
  SELECT * INTO v_session FROM public.user_sessions WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Calculate duration
  v_duration := EXTRACT(EPOCH FROM (now() - v_session.session_start))::INTEGER;

  -- Update session
  UPDATE public.user_sessions 
  SET 
    session_end = now(),
    duration_seconds = v_duration,
    exit_point = p_exit_point,
    metadata = v_session.metadata || p_metadata,
    updated_at = now()
  WHERE id = p_session_id;

  -- Log the session end activity
  PERFORM public.log_user_activity(
    v_session.user_id,
    CASE 
      WHEN v_session.course_id IS NOT NULL THEN 'course_exit'::activity_type
      ELSE 'logout'::activity_type
    END,
    v_session.course_id,
    NULL, -- unit_id
    NULL, -- quiz_id
    p_session_id::TEXT, -- session_id
    v_duration,
    jsonb_build_object('session_type', v_session.session_type, 'exit_point', p_exit_point),
    v_session.ip_address,
    v_session.user_agent
  );

  RETURN TRUE;
END;
$function$;

-- 17) get_user_session_stats
CREATE OR REPLACE FUNCTION public.get_user_session_stats(p_user_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
RETURNS TABLE(user_id uuid, user_email text, total_sessions integer, total_time_seconds integer, avg_session_duration integer, course_sessions integer, general_sessions integer, last_activity timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    p.email,
    COUNT(us.id)::INTEGER as total_sessions,
    COALESCE(SUM(us.duration_seconds), 0)::INTEGER as total_time_seconds,
    COALESCE(AVG(us.duration_seconds), 0)::INTEGER as avg_session_duration,
    COUNT(CASE WHEN us.session_type = 'course' THEN 1 END)::INTEGER as course_sessions,
    COUNT(CASE WHEN us.session_type = 'general' THEN 1 END)::INTEGER as general_sessions,
    MAX(us.session_start) as last_activity
  FROM public.user_sessions us
  JOIN public.profiles p ON us.user_id = p.id
  WHERE 
    (p_user_id IS NULL OR us.user_id = p_user_id)
    AND (p_start_date IS NULL OR us.session_start::DATE >= p_start_date)
    AND (p_end_date IS NULL OR us.session_start::DATE <= p_end_date)
    AND p.is_deleted = false
  GROUP BY us.user_id, p.email
  ORDER BY last_activity DESC;
END;
$function$;

-- 18) audit helpers were updated above; ensure no logic changed.
