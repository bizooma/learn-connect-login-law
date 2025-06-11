
-- First, let's update any courses with empty or null categories
UPDATE public.courses 
SET 
  category = CASE 
    WHEN level LIKE 'Legal%' THEN 'Legal'
    WHEN level LIKE 'Sales%' THEN 'Sales'
    ELSE 'General'
  END,
  updated_at = now()
WHERE category IS NULL OR trim(category) = '';

-- Update any courses with empty or null instructors
UPDATE public.courses 
SET 
  instructor = 'Attorney Hillary',
  updated_at = now()
WHERE instructor IS NULL OR trim(instructor) = '';

-- Update the three specific courses with empty titles
UPDATE public.courses 
SET 
  title = 'Legal Training-100',
  category = 'Legal',
  level = 'Legal-100',
  instructor = 'Attorney Hillary',
  description = COALESCE(description, 'Legal training course for entry level'),
  updated_at = now()
WHERE id = '40cd2ef8-2db6-474c-b635-86df1835c5e1';

UPDATE public.courses 
SET 
  title = 'Legal Training-200',
  category = 'Legal', 
  level = 'Legal-200',
  instructor = 'Attorney Hillary',
  description = COALESCE(description, 'Legal training course for intermediate level'),
  updated_at = now()
WHERE id = '64a255ed-96cc-411e-817c-f787ee34351f';

UPDATE public.courses 
SET 
  title = 'Sales Training-300',
  category = 'Sales',
  level = 'Sales-300', 
  instructor = 'Attorney Hillary',
  description = COALESCE(description, 'Sales training course for advanced level'),
  updated_at = now()
WHERE id = '2b806e84-b293-4529-a4d4-0af1ac429209';

-- Now add the constraints to prevent future empty values
ALTER TABLE public.courses 
ADD CONSTRAINT courses_title_not_empty 
CHECK (title IS NOT NULL AND trim(title) != '');

ALTER TABLE public.courses 
ADD CONSTRAINT courses_instructor_not_empty 
CHECK (instructor IS NOT NULL AND trim(instructor) != '');

ALTER TABLE public.courses 
ADD CONSTRAINT courses_category_not_empty 
CHECK (category IS NOT NULL AND trim(category) != '');
