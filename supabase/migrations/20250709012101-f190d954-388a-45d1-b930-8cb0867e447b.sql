-- Create optimized database functions for centralized progress calculations

-- Create function for batch progress fetching
CREATE OR REPLACE FUNCTION public.batch_fetch_user_progress(p_user_ids UUID[])
RETURNS TABLE(
  user_id UUID,
  course_id UUID,
  course_title TEXT,
  course_category TEXT,
  status TEXT,
  progress_percentage INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ucp.user_id,
    ucp.course_id,
    c.title as course_title,
    c.category as course_category,
    ucp.status,
    ucp.progress_percentage,
    ucp.completed_at,
    ucp.last_accessed_at
  FROM user_course_progress ucp
  JOIN courses c ON ucp.course_id = c.id
  WHERE ucp.user_id = ANY(p_user_ids)
  ORDER BY ucp.user_id, ucp.last_accessed_at DESC;
END;
$$;

-- Create function for efficient unit progress calculation
CREATE OR REPLACE FUNCTION public.calculate_unit_progress_efficient(p_user_id UUID, p_course_id UUID)
RETURNS TABLE(
  total_units INTEGER,
  completed_units INTEGER,
  progress_percentage INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_units INTEGER;
  v_completed_units INTEGER;
  v_progress_percentage INTEGER;
  v_status TEXT;
BEGIN
  -- Get total units for the course efficiently using a single query
  WITH course_units AS (
    SELECT COUNT(u.id) as total
    FROM units u
    JOIN lessons l ON u.section_id = l.id
    WHERE l.course_id = p_course_id
  ),
  completed_units_count AS (
    SELECT COUNT(uup.id) as completed
    FROM user_unit_progress uup
    WHERE uup.user_id = p_user_id 
      AND uup.course_id = p_course_id 
      AND uup.completed = true
  )
  SELECT 
    cu.total,
    cuc.completed,
    CASE 
      WHEN cu.total = 0 THEN 0
      ELSE ROUND((cuc.completed::DECIMAL / cu.total::DECIMAL) * 100)
    END,
    CASE 
      WHEN cu.total = 0 THEN 'not_started'
      WHEN cuc.completed = cu.total THEN 'completed'
      WHEN cuc.completed > 0 THEN 'in_progress'
      ELSE 'not_started'
    END
  INTO v_total_units, v_completed_units, v_progress_percentage, v_status
  FROM course_units cu, completed_units_count cuc;

  RETURN QUERY SELECT v_total_units, v_completed_units, v_progress_percentage, v_status;
END;
$$;

-- Create function for team progress aggregation
CREATE OR REPLACE FUNCTION public.get_team_progress_summary(p_team_id UUID)
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  total_courses INTEGER,
  completed_courses INTEGER,
  in_progress_courses INTEGER,
  overall_progress INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH team_members AS (
    SELECT 
      atm.user_id,
      p.email,
      CONCAT(p.first_name, ' ', p.last_name) as name
    FROM admin_team_members atm
    JOIN profiles p ON atm.user_id = p.id
    WHERE atm.team_id = p_team_id
      AND p.is_deleted = false
  ),
  member_progress AS (
    SELECT 
      tm.user_id,
      tm.email,
      tm.name,
      COUNT(ucp.id) as total_courses,
      COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) as completed_courses,
      COUNT(CASE WHEN ucp.status = 'in_progress' THEN 1 END) as in_progress_courses,
      CASE 
        WHEN COUNT(ucp.id) = 0 THEN 0
        ELSE ROUND(AVG(ucp.progress_percentage))
      END as overall_progress
    FROM team_members tm
    LEFT JOIN user_course_progress ucp ON tm.user_id = ucp.user_id
    GROUP BY tm.user_id, tm.email, tm.name
  )
  SELECT 
    mp.user_id,
    mp.email,
    mp.name,
    mp.total_courses::INTEGER,
    mp.completed_courses::INTEGER,
    mp.in_progress_courses::INTEGER,
    mp.overall_progress::INTEGER
  FROM member_progress mp
  ORDER BY mp.overall_progress DESC, mp.name;
END;
$$;

-- Create materialized view for expensive progress calculations
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_progress_summary AS
SELECT 
  p.id as user_id,
  p.email,
  CONCAT(p.first_name, ' ', p.last_name) as name,
  COUNT(ucp.id) as total_courses,
  COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) as completed_courses,
  COUNT(CASE WHEN ucp.status = 'in_progress' THEN 1 END) as in_progress_courses,
  COUNT(CASE WHEN ucp.status = 'not_started' THEN 1 END) as not_started_courses,
  CASE 
    WHEN COUNT(ucp.id) = 0 THEN 0
    ELSE ROUND(AVG(ucp.progress_percentage))
  END as overall_progress,
  MAX(ucp.last_accessed_at) as last_activity
FROM profiles p
LEFT JOIN user_course_progress ucp ON p.id = ucp.user_id
WHERE p.is_deleted = false
GROUP BY p.id, p.email, p.first_name, p.last_name;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_summary_user_id 
ON public.user_progress_summary (user_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_user_progress_summary()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_progress_summary;
END;
$$;

-- Create indexes for efficient progress queries
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id_status 
ON public.user_course_progress (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_course_id_status 
ON public.user_course_progress (course_id, status);

CREATE INDEX IF NOT EXISTS idx_user_unit_progress_user_course_completed 
ON public.user_unit_progress (user_id, course_id, completed);

CREATE INDEX IF NOT EXISTS idx_user_unit_progress_course_completed 
ON public.user_unit_progress (course_id, completed) WHERE completed = true;

-- Create function for optimized progress invalidation
CREATE OR REPLACE FUNCTION public.invalidate_progress_cache(p_user_id UUID DEFAULT NULL, p_course_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be used to trigger cache invalidation
  -- in the application layer when progress data changes
  
  -- For now, just refresh the materialized view if no specific parameters
  IF p_user_id IS NULL AND p_course_id IS NULL THEN
    PERFORM public.refresh_user_progress_summary();
  END IF;
  
  -- Could extend this to notify specific cache keys
  RAISE NOTICE 'Progress cache invalidation requested for user_id: %, course_id: %', p_user_id, p_course_id;
END;
$$;

-- Create trigger to auto-refresh progress summary on changes
CREATE OR REPLACE FUNCTION public.trigger_progress_summary_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Schedule a refresh of the materialized view
  -- This will be done asynchronously to avoid blocking the transaction
  PERFORM pg_notify('refresh_progress_summary', NEW.user_id::TEXT);
  RETURN NEW;
END;
$$;

-- Create triggers for automatic cache invalidation
DROP TRIGGER IF EXISTS trigger_user_course_progress_refresh ON public.user_course_progress;
CREATE TRIGGER trigger_user_course_progress_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.user_course_progress
  FOR EACH ROW EXECUTE FUNCTION public.trigger_progress_summary_refresh();

DROP TRIGGER IF EXISTS trigger_user_unit_progress_refresh ON public.user_unit_progress;
CREATE TRIGGER trigger_user_unit_progress_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.user_unit_progress
  FOR EACH ROW EXECUTE FUNCTION public.trigger_progress_summary_refresh();