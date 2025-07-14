-- Complete cleanup of deleted Legal Training-300 units
-- Phase 1: Backup affected progress data
DO $$
DECLARE
    v_unit_ids uuid[] := ARRAY[
        -- Get unit IDs for the specific units to be deleted
        (SELECT id FROM units WHERE title = 'How to Create the Transcript'),
        (SELECT id FROM units WHERE title = 'Using Claude AI to Draft Addendums'),
        (SELECT id FROM units WHERE title = 'Claude Prompts During the Interview'),
        (SELECT id FROM units WHERE title = 'Using Claude AI to Draft Cover Letters'),
        (SELECT id FROM units WHERE title = 'Claude Prompts, Prepare for the Declaration')
    ];
    v_course_id uuid;
    v_backup_count integer := 0;
    v_progress_deleted integer := 0;
    v_video_deleted integer := 0;
    v_units_deleted integer := 0;
BEGIN
    -- Get the Legal Training-300 course ID
    SELECT id INTO v_course_id FROM courses WHERE title LIKE '%Legal Training%300%';
    
    -- Backup user_unit_progress records
    INSERT INTO orphaned_progress_backup (
        original_data, user_id, course_id, unit_id, 
        backup_type, original_table, reason
    )
    SELECT 
        row_to_json(uup),
        uup.user_id,
        uup.course_id,
        uup.unit_id,
        'unit_cleanup',
        'user_unit_progress',
        'Cleanup of deleted Legal Training-300 units: ' || u.title
    FROM user_unit_progress uup
    JOIN units u ON uup.unit_id = u.id
    WHERE uup.unit_id = ANY(v_unit_ids);
    
    GET DIAGNOSTICS v_backup_count = ROW_COUNT;
    
    -- Backup user_video_progress records
    INSERT INTO orphaned_progress_backup (
        original_data, user_id, course_id, unit_id,
        backup_type, original_table, reason
    )
    SELECT 
        row_to_json(uvp),
        uvp.user_id,
        uvp.course_id,
        uvp.unit_id,
        'unit_cleanup',
        'user_video_progress',
        'Cleanup of deleted Legal Training-300 units: ' || u.title
    FROM user_video_progress uvp
    JOIN units u ON uvp.unit_id = u.id
    WHERE uvp.unit_id = ANY(v_unit_ids);
    
    -- Phase 2: Delete progress records
    DELETE FROM user_unit_progress WHERE unit_id = ANY(v_unit_ids);
    GET DIAGNOSTICS v_progress_deleted = ROW_COUNT;
    
    DELETE FROM user_video_progress WHERE unit_id = ANY(v_unit_ids);
    GET DIAGNOSTICS v_video_deleted = ROW_COUNT;
    
    -- Phase 3: Delete the units themselves
    DELETE FROM units WHERE id = ANY(v_unit_ids);
    GET DIAGNOSTICS v_units_deleted = ROW_COUNT;
    
    -- Phase 4: Recalculate course progress for affected users
    PERFORM public.update_course_progress_reliable(
        backup.user_id, 
        v_course_id
    )
    FROM (
        SELECT DISTINCT user_id 
        FROM orphaned_progress_backup 
        WHERE backup_type = 'unit_cleanup' 
        AND backed_up_at >= now() - interval '5 minutes'
    ) backup;
    
    -- Log the cleanup results
    RAISE NOTICE 'Unit cleanup completed:';
    RAISE NOTICE '- Backed up % progress records', v_backup_count;
    RAISE NOTICE '- Deleted % unit progress records', v_progress_deleted;
    RAISE NOTICE '- Deleted % video progress records', v_video_deleted;
    RAISE NOTICE '- Deleted % units', v_units_deleted;
    RAISE NOTICE '- Recalculated course progress for affected users';
    
END $$;