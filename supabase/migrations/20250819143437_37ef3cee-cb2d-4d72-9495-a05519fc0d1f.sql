-- Create RPC function to get team leaders progress report
CREATE OR REPLACE FUNCTION public.get_team_leaders_progress_report()
RETURNS TABLE(
  team_leader_id uuid,
  team_leader_name text,
  team_leader_email text,
  member_id uuid,
  member_name text,
  member_email text,
  course_id uuid,
  course_title text,
  course_category text,
  progress_percentage integer,
  status text,
  assigned_at timestamp with time zone,
  due_date timestamp with time zone,
  completed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tl.id as team_leader_id,
    CONCAT(tl.first_name, ' ', tl.last_name) as team_leader_name,
    tl.email as team_leader_email,
    tm.id as member_id,
    CONCAT(tm.first_name, ' ', tm.last_name) as member_name,
    tm.email as member_email,
    ca.course_id,
    c.title as course_title,
    c.category as course_category,
    COALESCE(ucp.progress_percentage, 0) as progress_percentage,
    COALESCE(ucp.status, 'not_started') as status,
    ca.assigned_at,
    ca.due_date,
    ucp.completed_at
  FROM 
    public.profiles tl
  INNER JOIN 
    public.profiles tm ON tm.team_leader_id = tl.id
  INNER JOIN 
    public.course_assignments ca ON ca.user_id = tm.id
  INNER JOIN 
    public.courses c ON c.id = ca.course_id
  LEFT JOIN 
    public.user_course_progress ucp ON ucp.user_id = tm.id AND ucp.course_id = ca.course_id
  WHERE 
    tl.is_deleted = false 
    AND tm.is_deleted = false
    AND EXISTS (
      SELECT 1 FROM public.profiles team_members 
      WHERE team_members.team_leader_id = tl.id 
      AND team_members.is_deleted = false
    )
  ORDER BY 
    tl.email, tm.email, c.title;
END;
$function$;