-- Comprehensive fix for ALL of Julio's Legal Training course progress
-- User: Julio Macosay Guerrero (juliog@newfrontier.us)
-- Issue: Bulk recalculation reset all his progress to 0% despite completed units
-- Solution: Restore correct progress based on actual unit completions

DO $$ 
DECLARE
    total_updated INTEGER := 0;
    course_record RECORD;
BEGIN
    RAISE NOTICE 'Starting comprehensive fix for Julio''s Legal Training progress...';
    
    -- Show current state before updates
    RAISE NOTICE 'Current progress before fix:';
    FOR course_record IN 
        SELECT c.title, ucp.progress_percentage, ucp.status
        FROM user_course_progress ucp
        JOIN courses c ON ucp.course_id = c.id
        WHERE ucp.user_id = '7a44f56c-56ac-41f5-b1c5-18d3ac126e14'
          AND c.title LIKE '%Legal Training%'
        ORDER BY c.title
    LOOP
        RAISE NOTICE '  %: % (%)', course_record.title, course_record.progress_percentage, course_record.status;
    END LOOP;
    
    -- Fix Legal Training-100 (should be 100% completed)
    UPDATE user_course_progress 
    SET 
        progress_percentage = 100,
        status = 'completed',
        completed_at = COALESCE(completed_at, NOW()),
        updated_at = NOW()
    WHERE 
        user_id = '7a44f56c-56ac-41f5-b1c5-18d3ac126e14'
        AND course_id = (SELECT id FROM courses WHERE title = 'Legal Training-100' LIMIT 1);
    
    GET DIAGNOSTICS total_updated = ROW_COUNT;
    RAISE NOTICE 'Updated Legal Training-100: % rows', total_updated;
    
    -- Fix Legal Training-200 (should be 100% completed)
    UPDATE user_course_progress 
    SET 
        progress_percentage = 100,
        status = 'completed',
        completed_at = COALESCE(completed_at, NOW()),
        updated_at = NOW()
    WHERE 
        user_id = '7a44f56c-56ac-41f5-b1c5-18d3ac126e14'
        AND course_id = '64a255ed-96cc-411e-817c-f787ee34351f';
    
    GET DIAGNOSTICS total_updated = ROW_COUNT;
    RAISE NOTICE 'Updated Legal Training-200: % rows', total_updated;
    
    -- Fix Legal Training-300 (should be 19% in progress)
    UPDATE user_course_progress 
    SET 
        progress_percentage = 19,
        status = 'in_progress',
        started_at = COALESCE(started_at, NOW()),
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE 
        user_id = '7a44f56c-56ac-41f5-b1c5-18d3ac126e14'
        AND course_id = (SELECT id FROM courses WHERE title = 'Legal Training-300' LIMIT 1);
    
    GET DIAGNOSTICS total_updated = ROW_COUNT;
    RAISE NOTICE 'Updated Legal Training-300: % rows', total_updated;
    
    -- Show final state after updates
    RAISE NOTICE 'Final progress after fix:';
    FOR course_record IN 
        SELECT c.title, ucp.progress_percentage, ucp.status, ucp.completed_at
        FROM user_course_progress ucp
        JOIN courses c ON ucp.course_id = c.id
        WHERE ucp.user_id = '7a44f56c-56ac-41f5-b1c5-18d3ac126e14'
          AND c.title LIKE '%Legal Training%'
        ORDER BY c.title
    LOOP
        RAISE NOTICE '  %: % (%) - Completed: %', 
            course_record.title, 
            course_record.progress_percentage, 
            course_record.status,
            course_record.completed_at;
    END LOOP;
    
    RAISE NOTICE 'Comprehensive fix completed successfully!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during fix: %', SQLERRM;
    RAISE;
END $$;