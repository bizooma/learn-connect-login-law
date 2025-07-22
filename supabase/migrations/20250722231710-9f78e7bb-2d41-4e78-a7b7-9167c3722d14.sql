
-- First, let's assign the immigration law training course to all existing free users
INSERT INTO public.course_assignments (user_id, course_id, assigned_by, assigned_at, notes)
SELECT 
  ur.user_id,
  'a956b14f-05a3-48bf-b6e4-65a7f3c5f89f' as course_id,
  '00000000-0000-0000-0000-000000000000' as assigned_by, -- System assignment
  now() as assigned_at,
  'Automatically assigned free immigration law training course' as notes
FROM public.user_roles ur
WHERE ur.role = 'free'
AND NOT EXISTS (
  SELECT 1 FROM public.course_assignments ca 
  WHERE ca.user_id = ur.user_id 
  AND ca.course_id = 'a956b14f-05a3-48bf-b6e4-65a7f3c5f89f'
);

-- Create initial course progress for all free users
INSERT INTO public.user_course_progress (user_id, course_id, status, progress_percentage, started_at, last_accessed_at)
SELECT 
  ur.user_id,
  'a956b14f-05a3-48bf-b6e4-65a7f3c5f89f' as course_id,
  'not_started' as status,
  0 as progress_percentage,
  now() as started_at,
  now() as last_accessed_at
FROM public.user_roles ur
WHERE ur.role = 'free'
AND NOT EXISTS (
  SELECT 1 FROM public.user_course_progress ucp 
  WHERE ucp.user_id = ur.user_id 
  AND ucp.course_id = 'a956b14f-05a3-48bf-b6e4-65a7f3c5f89f'
);

-- Create a function to automatically assign the immigration law course to new free users
CREATE OR REPLACE FUNCTION public.assign_free_immigration_course()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if the new role is 'free'
  IF NEW.role = 'free' THEN
    -- Assign the immigration law training course
    INSERT INTO public.course_assignments (user_id, course_id, assigned_by, assigned_at, notes)
    VALUES (
      NEW.user_id,
      'a956b14f-05a3-48bf-b6e4-65a7f3c5f89f',
      '00000000-0000-0000-0000-000000000000', -- System assignment
      now(),
      'Automatically assigned free immigration law training course'
    );
    
    -- Create initial course progress
    INSERT INTO public.user_course_progress (user_id, course_id, status, progress_percentage, started_at, last_accessed_at)
    VALUES (
      NEW.user_id,
      'a956b14f-05a3-48bf-b6e4-65a7f3c5f89f',
      'not_started',
      0,
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign immigration course to new free users
CREATE TRIGGER assign_free_immigration_course_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_free_immigration_course();
