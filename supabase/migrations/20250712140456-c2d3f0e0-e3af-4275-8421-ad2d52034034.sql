-- Create global_event_roles table to store which user roles should see each global event
CREATE TABLE public.global_event_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  global_event_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (global_event_id) REFERENCES public.global_events(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.global_event_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for global_event_roles
CREATE POLICY "Admins can manage global event roles" 
ON public.global_event_roles
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view global event role mappings for their role" 
ON public.global_event_roles
FOR SELECT 
USING (
  role IN (
    SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- Update global_events RLS policy to also include role-based targeting
DROP POLICY IF EXISTS "Users can view global events for assigned courses" ON public.global_events;

CREATE POLICY "Users can view global events for assigned courses or their role" 
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
);