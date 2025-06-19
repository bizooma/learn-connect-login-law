
-- Check and update RLS policies for global events visibility

-- First, let's check if we have the right policies for students to view global events
-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view global events for their courses" ON public.global_events;
DROP POLICY IF EXISTS "Users can view global event course mappings" ON public.global_event_courses;

-- Create improved policy for students to view global events for courses they're assigned to
CREATE POLICY "Users can view global events for assigned courses" ON public.global_events
  FOR SELECT USING (
    id IN (
      SELECT gec.global_event_id 
      FROM public.global_event_courses gec
      WHERE gec.course_id IN (
        SELECT ca.course_id 
        FROM public.course_assignments ca 
        WHERE ca.user_id = auth.uid()
        UNION
        SELECT ucp.course_id 
        FROM public.user_course_progress ucp 
        WHERE ucp.user_id = auth.uid()
      )
    )
  );

-- Create policy for viewing global event course mappings
CREATE POLICY "Users can view global event course mappings for assigned courses" ON public.global_event_courses
  FOR SELECT USING (
    course_id IN (
      SELECT ca.course_id 
      FROM public.course_assignments ca 
      WHERE ca.user_id = auth.uid()
      UNION
      SELECT ucp.course_id 
      FROM public.user_course_progress ucp 
      WHERE ucp.user_id = auth.uid()
    )
  );
