
-- Phase 1: Safe Database Enhancements for User Activity Tracking

-- 1. Add new activity types to existing enum (safe addition)
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'login';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'logout';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'course_enter';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'course_exit';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'session_timeout';

-- 2. Create new user_sessions table for detailed session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  session_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'course', 'unit'
  entry_point TEXT, -- URL or route where session started
  exit_point TEXT, -- URL or route where session ended
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Add indexes for performance (non-breaking)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_course_id ON public.user_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON public.user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_type ON public.user_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_duration ON public.user_sessions(duration_seconds);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_course ON public.user_sessions(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_date ON public.user_sessions(user_id, session_start);

-- 4. Create database functions for session management

-- Function to start a new user session
CREATE OR REPLACE FUNCTION public.start_user_session(
  p_user_id UUID,
  p_course_id UUID DEFAULT NULL,
  p_session_type TEXT DEFAULT 'general',
  p_entry_point TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to end a user session
CREATE OR REPLACE FUNCTION public.end_user_session(
  p_session_id UUID,
  p_exit_point TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to get user session statistics
CREATE OR REPLACE FUNCTION public.get_user_session_stats(
  p_user_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  total_sessions INTEGER,
  total_time_seconds INTEGER,
  avg_session_duration INTEGER,
  course_sessions INTEGER,
  general_sessions INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Enable Row Level Security for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" 
  ON public.user_sessions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert sessions" 
  ON public.user_sessions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update sessions" 
  ON public.user_sessions 
  FOR UPDATE 
  USING (true);
