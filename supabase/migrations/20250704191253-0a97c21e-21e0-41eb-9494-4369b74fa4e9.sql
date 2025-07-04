-- Create badge templates table
CREATE TABLE public.badge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  badge_color TEXT DEFAULT '#FFD700',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on badge templates
ALTER TABLE public.badge_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for badge templates
CREATE POLICY "Admins can manage badge templates" 
ON public.badge_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Everyone can view active badge templates" 
ON public.badge_templates 
FOR SELECT 
USING (is_active = true);

-- Add template_id to user_achievements for linking
ALTER TABLE public.user_achievements 
ADD COLUMN template_id UUID REFERENCES public.badge_templates(id);

-- Create storage bucket for badge images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('badge-images', 'badge-images', true);

-- Create storage policies for badge images
CREATE POLICY "Admins can upload badge images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'badge-images' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

CREATE POLICY "Everyone can view badge images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'badge-images');

CREATE POLICY "Admins can update badge images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'badge-images' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

CREATE POLICY "Admins can delete badge images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'badge-images' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- Update the assign_badge_to_user function to work with templates
CREATE OR REPLACE FUNCTION public.assign_badge_from_template(
  p_user_id UUID,
  p_template_id UUID,
  p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement_id UUID;
  v_template RECORD;
BEGIN
  -- Check if performer has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_assigned_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can assign badges';
  END IF;

  -- Get template details
  SELECT * INTO v_template FROM public.badge_templates WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Badge template not found';
  END IF;

  -- Check if user exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_deleted = false
  ) THEN
    RAISE EXCEPTION 'User not found or is deleted';
  END IF;

  -- Check if user already has this badge template
  IF EXISTS (
    SELECT 1 FROM public.user_achievements 
    WHERE user_id = p_user_id 
    AND template_id = p_template_id 
    AND is_badge = true
  ) THEN
    RAISE EXCEPTION 'User already has this badge';
  END IF;

  -- Insert the badge achievement using template
  INSERT INTO public.user_achievements (
    user_id,
    achievement_type,
    achievement_name,
    description,
    badge_name,
    badge_image_url,
    badge_color,
    is_badge,
    template_id,
    assigned_by,
    metadata
  ) VALUES (
    p_user_id,
    'template_badge',
    v_template.name,
    v_template.description,
    v_template.name,
    v_template.image_url,
    v_template.badge_color,
    true,
    p_template_id,
    p_assigned_by,
    jsonb_build_object(
      'assigned_from_template', true,
      'template_id', p_template_id,
      'assigned_at', now(),
      'assigned_by', p_assigned_by
    )
  ) RETURNING id INTO v_achievement_id;

  RETURN v_achievement_id;
END;
$$;