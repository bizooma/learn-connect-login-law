
-- Update the category leaderboard function to be more inclusive and show actual users
CREATE OR REPLACE FUNCTION public.generate_category_leaderboard(p_category text, p_limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, user_name text, user_email text, completion_rate numeric, courses_completed integer, total_courses integer, rank_position integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH category_stats AS (
    SELECT 
      ca.user_id,
      COUNT(*) as total_assigned,
      COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) as completed_count,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
        ELSE 0 
      END as completion_percentage
    FROM course_assignments ca
    JOIN courses c ON ca.course_id = c.id
    LEFT JOIN user_course_progress ucp ON ca.user_id = ucp.user_id AND ca.course_id = ucp.course_id
    WHERE c.category = p_category
    GROUP BY ca.user_id
    HAVING COUNT(*) > 0 -- Must have at least one course assigned
  ),
  ranked_users AS (
    SELECT 
      cs.*,
      ROW_NUMBER() OVER (ORDER BY cs.completion_percentage DESC, cs.completed_count DESC) as rank_num
    FROM category_stats cs
  )
  SELECT 
    ru.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    p.email as user_email,
    ROUND(ru.completion_percentage, 2) as completion_rate,
    ru.completed_count::INTEGER as courses_completed,
    ru.total_assigned::INTEGER as total_courses,
    ru.rank_num::INTEGER as rank_position
  FROM ranked_users ru
  JOIN profiles p ON ru.user_id = p.id
  WHERE p.is_deleted = false
  ORDER BY ru.completion_percentage DESC, ru.completed_count DESC
  LIMIT p_limit;
END;
$function$;

-- Update the learning streak leaderboard to be more inclusive (reduce minimum streak requirement)
CREATE OR REPLACE FUNCTION public.generate_learning_streak_leaderboard(p_limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, user_name text, user_email text, current_streak integer, longest_streak integer, rank_position integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    uls.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    p.email as user_email,
    uls.current_streak,
    uls.longest_streak,
    ROW_NUMBER() OVER (ORDER BY uls.current_streak DESC, uls.longest_streak DESC)::INTEGER as rank_position
  FROM user_learning_streaks uls
  JOIN profiles p ON uls.user_id = p.id
  WHERE uls.current_streak >= 1  -- Reduced from 5 to 1 to show more users
    AND uls.is_active = true
    AND p.is_deleted = false
    AND uls.last_activity_date >= CURRENT_DATE - INTERVAL '7 days' -- Extended grace period
  ORDER BY uls.current_streak DESC, uls.longest_streak DESC
  LIMIT p_limit;
END;
$function$;

-- Function to initialize learning streaks based on existing user activity
CREATE OR REPLACE FUNCTION public.initialize_learning_streaks_from_activity()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_users_updated INTEGER := 0;
  v_user_record RECORD;
  v_completion_dates DATE[];
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_date DATE;
BEGIN
  -- Loop through users who have completed units but don't have streak records
  FOR v_user_record IN
    SELECT DISTINCT uup.user_id
    FROM user_unit_progress uup
    JOIN profiles p ON uup.user_id = p.id
    WHERE uup.completed = true 
      AND p.is_deleted = false
      AND NOT EXISTS (
        SELECT 1 FROM user_learning_streaks uls 
        WHERE uls.user_id = uup.user_id
      )
    LIMIT 50  -- Process in batches
  LOOP
    -- Get all completion dates for this user
    SELECT ARRAY_AGG(DISTINCT DATE(completed_at) ORDER BY DATE(completed_at))
    INTO v_completion_dates
    FROM user_unit_progress
    WHERE user_id = v_user_record.user_id AND completed = true;
    
    -- Calculate current and longest streak from completion dates
    v_current_streak := 1;
    v_longest_streak := 1;
    v_last_date := v_completion_dates[array_upper(v_completion_dates, 1)];
    
    -- If user has recent activity, set a basic streak
    IF v_last_date >= CURRENT_DATE - INTERVAL '7 days' THEN
      v_current_streak := LEAST(array_length(v_completion_dates, 1), 7); -- Cap at 7 days
      v_longest_streak := v_current_streak;
    ELSE
      v_current_streak := 0; -- No recent activity
      v_longest_streak := 1;
    END IF;
    
    -- Insert the streak record
    INSERT INTO user_learning_streaks (
      user_id,
      current_streak,
      longest_streak,
      last_activity_date,
      streak_start_date,
      is_active
    ) VALUES (
      v_user_record.user_id,
      v_current_streak,
      v_longest_streak,
      v_last_date,
      v_last_date,
      v_current_streak > 0
    );
    
    v_users_updated := v_users_updated + 1;
  END LOOP;
  
  RETURN v_users_updated;
END;
$function$;

-- Function to manually refresh and populate leaderboards with debug info
CREATE OR REPLACE FUNCTION public.debug_refresh_leaderboards()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_streak_count INTEGER;
  v_sales_count INTEGER;
  v_legal_count INTEGER;
  v_streaks_initialized INTEGER;
BEGIN
  -- Initialize learning streaks from existing activity
  SELECT public.initialize_learning_streaks_from_activity() INTO v_streaks_initialized;
  
  -- Clear all existing cache
  DELETE FROM leaderboard_cache;
  
  -- Refresh learning streak leaderboard
  INSERT INTO leaderboard_cache (leaderboard_type, user_id, user_name, user_email, score, rank_position, additional_data)
  SELECT 
    'learning_streak',
    user_id,
    user_name,
    user_email,
    current_streak,
    rank_position,
    jsonb_build_object(
      'longest_streak', longest_streak,
      'current_streak', current_streak
    )
  FROM generate_learning_streak_leaderboard(50);
  
  GET DIAGNOSTICS v_streak_count = ROW_COUNT;
  
  -- Refresh sales training leaderboard
  INSERT INTO leaderboard_cache (leaderboard_type, user_id, user_name, user_email, score, rank_position, additional_data)
  SELECT 
    'sales_training',
    user_id,
    user_name,
    user_email,
    completion_rate,
    rank_position,
    jsonb_build_object(
      'courses_completed', courses_completed,
      'total_courses', total_courses,
      'completion_rate', completion_rate
    )
  FROM generate_category_leaderboard('Sales', 50);
  
  GET DIAGNOSTICS v_sales_count = ROW_COUNT;
  
  -- Refresh legal training leaderboard
  INSERT INTO leaderboard_cache (leaderboard_type, user_id, user_name, user_email, score, rank_position, additional_data)
  SELECT 
    'legal_training',
    user_id,
    user_name,
    user_email,
    completion_rate,
    rank_position,
    jsonb_build_object(
      'courses_completed', courses_completed,
      'total_courses', total_courses,
      'completion_rate', completion_rate
    )
  FROM generate_category_leaderboard('Legal', 50);
  
  GET DIAGNOSTICS v_legal_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'streaks_initialized', v_streaks_initialized,
    'streak_leaderboard_entries', v_streak_count,
    'sales_leaderboard_entries', v_sales_count,
    'legal_leaderboard_entries', v_legal_count,
    'total_cache_entries', v_streak_count + v_sales_count + v_legal_count
  );
END;
$function$;
