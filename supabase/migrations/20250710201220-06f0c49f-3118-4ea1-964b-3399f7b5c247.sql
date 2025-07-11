-- Direct fix for Julio's Legal Training-200 progress using exact IDs
-- User: Julio Macosay Guerrero (juliog@newfrontier.us)
-- Course: Legal Training-200

DO $$ 
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update with exact IDs to avoid any ambiguity
    UPDATE user_course_progress 
    SET 
        progress_percentage = 96,
        status = 'in_progress',
        updated_at = NOW()
    WHERE 
        user_id = '7a44f56c-56ac-41f5-b1c5-18d3ac126e14'
        AND course_id = '64a255ed-96cc-411e-817c-f787ee34351f';
    
    -- Check how many rows were affected
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Verify the update worked
    IF affected_rows > 0 THEN
        RAISE NOTICE 'Successfully updated % row(s) for Julio''s Legal Training-200 progress', affected_rows;
        
        -- Show the updated record
        PERFORM progress_percentage, status, updated_at 
        FROM user_course_progress 
        WHERE user_id = '7a44f56c-56ac-41f5-b1c5-18d3ac126e14' 
          AND course_id = '64a255ed-96cc-411e-817c-f787ee34351f';
    ELSE
        RAISE NOTICE 'No rows were updated - record may not exist or may be locked';
    END IF;
END $$;