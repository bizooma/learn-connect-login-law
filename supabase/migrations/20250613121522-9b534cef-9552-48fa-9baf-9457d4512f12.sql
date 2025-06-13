
-- Fix the course assignment trigger to handle existing records properly
CREATE OR REPLACE FUNCTION public.handle_course_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Create or update user course progress when a course is assigned
  INSERT INTO public.user_course_progress (
    user_id,
    course_id,
    status,
    progress_percentage,
    started_at,
    last_accessed_at
  )
  VALUES (
    NEW.user_id,
    NEW.course_id,
    'not_started',
    0,
    NEW.assigned_at,
    NEW.assigned_at
  )
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET
    last_accessed_at = GREATEST(user_course_progress.last_accessed_at, NEW.assigned_at),
    updated_at = now()
  WHERE user_course_progress.status = 'not_started'; -- Only update if still not started
  
  RETURN NEW;
END;
$function$;

-- Add a unique constraint on unit titles within the same section to prevent duplicates
-- First check if the constraint already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'units_title_section_unique'
    ) THEN
        -- Remove any existing duplicates before adding constraint
        WITH duplicates AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY title, section_id ORDER BY created_at) as rn
            FROM units
        )
        DELETE FROM units WHERE id IN (
            SELECT id FROM duplicates WHERE rn > 1
        );
        
        -- Add the unique constraint
        ALTER TABLE units ADD CONSTRAINT units_title_section_unique 
        UNIQUE (title, section_id);
    END IF;
END $$;

-- Create a function to safely update units with conflict resolution
CREATE OR REPLACE FUNCTION public.safe_unit_upsert(
    p_unit_id UUID,
    p_section_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_content TEXT,
    p_video_url TEXT,
    p_duration_minutes INTEGER,
    p_sort_order INTEGER,
    p_file_url TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL,
    p_file_size BIGINT DEFAULT NULL,
    p_files JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result_id UUID;
    v_conflict_title TEXT;
BEGIN
    -- Check for title conflicts in the same section
    SELECT title INTO v_conflict_title 
    FROM units 
    WHERE title = p_title 
      AND section_id = p_section_id 
      AND (p_unit_id IS NULL OR id != p_unit_id)
    LIMIT 1;
    
    -- If there's a conflict, append a suffix
    IF v_conflict_title IS NOT NULL THEN
        p_title := p_title || ' (Updated)';
    END IF;
    
    -- Perform the upsert
    INSERT INTO units (
        id, section_id, title, description, content, video_url, 
        duration_minutes, sort_order, file_url, file_name, file_size, files
    ) VALUES (
        COALESCE(p_unit_id, gen_random_uuid()), p_section_id, p_title, p_description, 
        p_content, p_video_url, p_duration_minutes, p_sort_order, 
        p_file_url, p_file_name, p_file_size, p_files
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        content = EXCLUDED.content,
        video_url = EXCLUDED.video_url,
        duration_minutes = EXCLUDED.duration_minutes,
        sort_order = EXCLUDED.sort_order,
        file_url = EXCLUDED.file_url,
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        files = EXCLUDED.files,
        updated_at = now()
    RETURNING id INTO v_result_id;
    
    RETURN v_result_id;
END;
$function$;
