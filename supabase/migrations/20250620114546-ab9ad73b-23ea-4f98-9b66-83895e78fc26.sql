
-- Create admin_teams table for custom admin teams
CREATE TABLE public.admin_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create admin_team_members table for team membership
CREATE TABLE public.admin_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.admin_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.admin_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_teams
CREATE POLICY "Admins can view all teams" 
  ON public.admin_teams 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can create teams" 
  ON public.admin_teams 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update teams" 
  ON public.admin_teams 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete teams" 
  ON public.admin_teams 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS policies for admin_team_members
CREATE POLICY "Admins can view all team members" 
  ON public.admin_team_members 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can add team members" 
  ON public.admin_team_members 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can remove team members" 
  ON public.admin_team_members 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Database functions for team management
CREATE OR REPLACE FUNCTION public.create_admin_team(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.add_team_member(
  p_team_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.remove_team_member(
  p_team_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_team_progress_summary(p_team_id UUID)
RETURNS TABLE(
  total_members INTEGER,
  courses_in_progress INTEGER,
  courses_completed INTEGER,
  average_progress NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
