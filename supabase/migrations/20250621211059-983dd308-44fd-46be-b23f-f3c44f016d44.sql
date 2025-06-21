
-- Create user learning streaks table to track consecutive learning days
CREATE TABLE public.user_learning_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create leaderboard cache table for performance
CREATE TABLE public.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type TEXT NOT NULL, -- 'learning_streak', 'sales_training', 'legal_training'
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  score NUMERIC NOT NULL, -- streak days or completion percentage
  rank_position INTEGER NOT NULL,
  additional_data JSONB DEFAULT '{}',
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '6 hours')
);

-- Create user achievements table for future gamification features
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'streak_5_days', 'streak_30_days', 'top_performer', etc.
  achievement_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Add indexes for performance
CREATE INDEX idx_user_learning_streaks_user_id ON public.user_learning_streaks(user_id);
CREATE INDEX idx_user_learning_streaks_current_streak ON public.user_learning_streaks(current_streak DESC);
CREATE INDEX idx_user_learning_streaks_active ON public.user_learning_streaks(is_active, current_streak DESC);

CREATE INDEX idx_leaderboard_cache_type_rank ON public.leaderboard_cache(leaderboard_type, rank_position);
CREATE INDEX idx_leaderboard_cache_expires ON public.leaderboard_cache(expires_at);
CREATE INDEX idx_leaderboard_cache_user ON public.leaderboard_cache(user_id);

CREATE INDEX idx_user_achievements_user_type ON public.user_achievements(user_id, achievement_type);
CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.user_learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_learning_streaks
CREATE POLICY "Users can view all learning streaks" ON public.user_learning_streaks
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own learning streaks" ON public.user_learning_streaks
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert learning streaks" ON public.user_learning_streaks
FOR INSERT TO authenticated WITH CHECK (true);

-- RLS policies for leaderboard_cache
CREATE POLICY "Users can view all leaderboard cache" ON public.leaderboard_cache
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage leaderboard cache" ON public.leaderboard_cache
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS policies for user_achievements
CREATE POLICY "Users can view all achievements" ON public.user_achievements
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.user_achievements
FOR INSERT TO authenticated WITH CHECK (true);

-- Function to update learning streak
CREATE OR REPLACE FUNCTION public.update_learning_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_current_streak INTEGER := 0;
  v_last_activity_date DATE;
  v_units_completed_today INTEGER;
BEGIN
  -- Check if user completed any units today
  SELECT COUNT(*) INTO v_units_completed_today
  FROM user_unit_progress uup
  WHERE uup.user_id = p_user_id
    AND uup.completed = true
    AND DATE(uup.completed_at) = v_today;
  
  -- If no units completed today, exit early
  IF v_units_completed_today = 0 THEN
    RETURN;
  END IF;
  
  -- Get current streak info
  SELECT current_streak, last_activity_date
  INTO v_current_streak, v_last_activity_date
  FROM user_learning_streaks
  WHERE user_id = p_user_id;
  
  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_learning_streaks (
      user_id, current_streak, longest_streak, last_activity_date, streak_start_date
    ) VALUES (
      p_user_id, 1, 1, v_today, v_today
    );
    RETURN;
  END IF;
  
  -- If already updated today, don't update again
  IF v_last_activity_date = v_today THEN
    RETURN;
  END IF;
  
  -- Calculate new streak
  IF v_last_activity_date = v_yesterday THEN
    -- Continue streak
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_activity_date < v_yesterday - INTERVAL '1 day' THEN
    -- Streak broken, start new one
    v_current_streak := 1;
  ELSE
    -- Same day or future date (shouldn't happen), keep current
    v_current_streak := GREATEST(v_current_streak, 1);
  END IF;
  
  -- Update streak record
  UPDATE user_learning_streaks
  SET current_streak = v_current_streak,
      longest_streak = GREATEST(longest_streak, v_current_streak),
      last_activity_date = v_today,
      streak_start_date = CASE 
        WHEN v_current_streak = 1 THEN v_today
        ELSE streak_start_date
      END,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Award achievements for significant streaks
  IF v_current_streak = 5 AND NOT EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_type = 'streak_5_days'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description)
    VALUES (p_user_id, 'streak_5_days', '5-Day Learning Streak', 'Completed at least 1 unit for 5 consecutive days');
  END IF;
  
  IF v_current_streak = 30 AND NOT EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_type = 'streak_30_days'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description)
    VALUES (p_user_id, 'streak_30_days', '30-Day Learning Streak', 'Completed at least 1 unit for 30 consecutive days');
  END IF;
END;
$$;

-- Function to generate learning streak leaderboard
CREATE OR REPLACE FUNCTION public.generate_learning_streak_leaderboard(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  current_streak INTEGER,
  longest_streak INTEGER,
  rank_position INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  WHERE uls.current_streak >= 5 
    AND uls.is_active = true
    AND p.is_deleted = false
    AND uls.last_activity_date >= CURRENT_DATE - INTERVAL '2 days' -- Grace period
  ORDER BY uls.current_streak DESC, uls.longest_streak DESC
  LIMIT p_limit;
END;
$$;

-- Function to generate category-based leaderboard
CREATE OR REPLACE FUNCTION public.generate_category_leaderboard(
  p_category TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  completion_rate NUMERIC,
  courses_completed INTEGER,
  total_courses INTEGER,
  rank_position INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      ROW_NUMBER() OVER (ORDER BY cs.completion_percentage DESC, cs.completed_count DESC) as rank_num,
      COUNT(*) OVER () as total_users
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
    AND ru.rank_num <= GREATEST(CEIL(ru.total_users * 0.1), p_limit) -- Top 10% or limit, whichever is larger
  ORDER BY ru.completion_percentage DESC, ru.completed_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to refresh leaderboard cache
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clear expired cache entries
  DELETE FROM leaderboard_cache WHERE expires_at < now();
  
  -- Refresh learning streak leaderboard
  DELETE FROM leaderboard_cache WHERE leaderboard_type = 'learning_streak';
  
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
  
  -- Refresh sales training leaderboard
  DELETE FROM leaderboard_cache WHERE leaderboard_type = 'sales_training';
  
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
  
  -- Refresh legal training leaderboard
  DELETE FROM leaderboard_cache WHERE leaderboard_type = 'legal_training';
  
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
END;
$$;

-- Update the existing log_user_activity function to include streak updates
-- This will automatically update streaks when units are completed
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID, 
  p_activity_type activity_type, 
  p_course_id UUID DEFAULT NULL, 
  p_unit_id UUID DEFAULT NULL, 
  p_quiz_id UUID DEFAULT NULL, 
  p_session_id TEXT DEFAULT NULL, 
  p_duration_seconds INTEGER DEFAULT NULL, 
  p_metadata JSONB DEFAULT '{}', 
  p_ip_address INET DEFAULT NULL, 
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    course_id,
    unit_id,
    quiz_id,
    session_id,
    duration_seconds,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_course_id,
    p_unit_id,
    p_quiz_id,
    p_session_id,
    p_duration_seconds,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_activity_id;
  
  -- Update learning streak if it's a learning activity
  IF p_activity_type IN ('course_access', 'unit_complete', 'quiz_complete') THEN
    PERFORM public.update_learning_streak(p_user_id);
  END IF;
  
  RETURN v_activity_id;
END;
$$;
