-- Create global_event_email_domains table to store email domain targeting
CREATE TABLE public.global_event_email_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  global_event_id UUID NOT NULL,
  email_domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (global_event_id) REFERENCES public.global_events(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.global_event_email_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for global_event_email_domains
CREATE POLICY "Admins can manage global event email domains" 
ON public.global_event_email_domains
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view global event email domain mappings for their domain" 
ON public.global_event_email_domains
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.email LIKE '%@' || email_domain
  )
);

-- Update global_events RLS policy to include email domain targeting
DROP POLICY IF EXISTS "Users can view global events for assigned courses or their role" ON public.global_events;

CREATE POLICY "Users can view global events for assigned courses, their role, or email domain" 
ON public.global_events
FOR SELECT 
USING (
  -- Can see events targeted at courses they're assigned to
  id IN (
    SELECT gec.global_event_id
    FROM global_event_courses gec
    WHERE gec.course_id IN (
      SELECT ca.course_id
      FROM course_assignments ca
      WHERE ca.user_id = auth.uid()
      UNION
      SELECT ucp.course_id
      FROM user_course_progress ucp
      WHERE ucp.user_id = auth.uid()
    )
  )
  OR
  -- Can see events targeted at their user role
  id IN (
    SELECT ger.global_event_id
    FROM global_event_roles ger
    WHERE ger.role IN (
      SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    )
  )
  OR
  -- Can see events targeted at their email domain
  id IN (
    SELECT ged.global_event_id
    FROM global_event_email_domains ged
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE p.email LIKE '%@' || ged.email_domain
  )
);