
-- Create table for global events that admins can create
CREATE TABLE public.global_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general',
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  meeting_link TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table to link global events to courses
CREATE TABLE public.global_event_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  global_event_id UUID NOT NULL REFERENCES public.global_events(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(global_event_id, course_id)
);

-- Enable RLS on both tables
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_event_courses ENABLE ROW LEVEL SECURITY;

-- Policies for global_events (only admins can manage)
CREATE POLICY "Admins can manage global events" ON public.global_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for global_event_courses (only admins can manage)
CREATE POLICY "Admins can manage global event courses" ON public.global_event_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy to allow users to view global events for courses they have access to
CREATE POLICY "Users can view global events for their courses" ON public.global_events
  FOR SELECT USING (
    id IN (
      SELECT gec.global_event_id 
      FROM public.global_event_courses gec
      JOIN public.course_assignments ca ON gec.course_id = ca.course_id
      WHERE ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view global event course mappings" ON public.global_event_courses
  FOR SELECT USING (
    course_id IN (
      SELECT course_id 
      FROM public.course_assignments 
      WHERE user_id = auth.uid()
    )
  );
