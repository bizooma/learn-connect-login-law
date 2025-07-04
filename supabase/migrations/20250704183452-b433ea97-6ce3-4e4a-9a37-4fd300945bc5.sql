-- Add badge-specific fields to user_achievements table
ALTER TABLE public.user_achievements 
ADD COLUMN IF NOT EXISTS badge_name TEXT,
ADD COLUMN IF NOT EXISTS badge_image_url TEXT,
ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#FFD700',
ADD COLUMN IF NOT EXISTS is_badge BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);

-- Create index for badge queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_badges ON public.user_achievements(user_id, is_badge) WHERE is_badge = true;

-- Create function for admins to manually assign badges
CREATE OR REPLACE FUNCTION public.assign_badge_to_user(
  p_user_id UUID,
  p_badge_name TEXT,
  p_description TEXT,
  p_badge_image_url TEXT DEFAULT NULL,
  p_badge_color TEXT DEFAULT '#FFD700',
  p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement_id UUID;
BEGIN
  -- Check if performer has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_assigned_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can assign badges';
  END IF;

  -- Check if user exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_deleted = false
  ) THEN
    RAISE EXCEPTION 'User not found or is deleted';
  END IF;

  -- Check if user already has this badge
  IF EXISTS (
    SELECT 1 FROM public.user_achievements 
    WHERE user_id = p_user_id 
    AND badge_name = p_badge_name 
    AND is_badge = true
  ) THEN
    RAISE EXCEPTION 'User already has this badge';
  END IF;

  -- Insert the badge achievement
  INSERT INTO public.user_achievements (
    user_id,
    achievement_type,
    achievement_name,
    description,
    badge_name,
    badge_image_url,
    badge_color,
    is_badge,
    assigned_by,
    metadata
  ) VALUES (
    p_user_id,
    'manual_badge',
    p_badge_name,
    p_description,
    p_badge_name,
    p_badge_image_url,
    p_badge_color,
    true,
    p_assigned_by,
    jsonb_build_object(
      'assigned_manually', true,
      'assigned_at', now(),
      'assigned_by', p_assigned_by
    )
  ) RETURNING id INTO v_achievement_id;

  RETURN v_achievement_id;
END;
$$;