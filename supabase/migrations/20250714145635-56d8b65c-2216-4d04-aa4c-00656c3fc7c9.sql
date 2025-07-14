-- Data Restoration Migration: Restore missing course assignments and progress for student@test.com
-- This addresses data loss from the June 11th progress_recalculation_fix operation

DO $$
DECLARE
    v_student_id UUID;
    v_admin_user_id UUID;
    v_course_record RECORD;
    v_total_units INTEGER;
    v_completed_units INTEGER;
    v_progress_percentage INTEGER;
    v_status TEXT;
    v_earliest_completion TIMESTAMP WITH TIME ZONE;
    v_latest_completion TIMESTAMP WITH TIME ZONE;
    v_courses_restored INTEGER := 0;
    v_assignments_created INTEGER := 0;
    v_progress_created INTEGER := 0;
BEGIN
    -- Get the student user ID
    SELECT id INTO v_student_id FROM profiles WHERE email = 'student@test.com';
    
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student with email student@test.com not found';
    END IF;
    
    -- Get an admin user for assignment attribution (using first admin found)
    SELECT user_id INTO v_admin_user_id 
    FROM user_roles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found for assignment attribution';
    END IF;
    
    RAISE NOTICE 'Starting data restoration for student ID: %', v_student_id;
    RAISE NOTICE 'Using admin ID for assignments: %', v_admin_user_id;
    
    -- Find all courses where student has unit progress but missing course assignments
    FOR v_course_record IN 
        WITH student_courses AS (
            SELECT DISTINCT 
                uup.course_id,
                COUNT(uup.unit_id) as completed_units_count,
                MIN(uup.completed_at) as earliest_completion,
                MAX(uup.completed_at) as latest_completion
            FROM user_unit_progress uup
            WHERE uup.user_id = v_student_id 
            AND uup.completed = true
            GROUP BY uup.course_id
        ),
        missing_assignments AS (
            SELECT sc.course_id, sc.completed_units_count, sc.earliest_completion, sc.latest_completion
            FROM student_courses sc
            LEFT JOIN course_assignments ca ON ca.user_id = v_student_id AND ca.course_id = sc.course_id
            WHERE ca.id IS NULL
        )
        SELECT 
            ma.course_id,
            c.title as course_title,
            ma.completed_units_count,
            ma.earliest_completion,
            ma.latest_completion
        FROM missing_assignments ma
        JOIN courses c ON c.id = ma.course_id
    LOOP
        RAISE NOTICE 'Processing course: % with ID: %', v_course_record.course_title, v_course_record.course_id;
        
        -- Calculate total units for this course
        SELECT COUNT(DISTINCT u.id) INTO v_total_units
        FROM units u
        JOIN lessons l ON u.section_id = l.id
        WHERE l.course_id = v_course_record.course_id
        AND u.is_draft = false;
        
        v_completed_units := v_course_record.completed_units_count;
        
        -- Calculate progress percentage and status
        IF v_total_units > 0 THEN
            v_progress_percentage := LEAST(100, (v_completed_units * 100) / v_total_units);
        ELSE
            v_progress_percentage := 0;
        END IF;
        
        v_status := CASE
            WHEN v_progress_percentage = 100 THEN 'completed'
            WHEN v_progress_percentage > 0 THEN 'in_progress'
            ELSE 'not_started'
        END;
        
        RAISE NOTICE 'Course has % total units, % completed, % percent progress, status: %', 
            v_total_units, v_completed_units, v_progress_percentage, v_status;
        
        -- Create missing course assignment
        INSERT INTO course_assignments (
            user_id,
            course_id,
            assigned_by,
            assigned_at,
            notes,
            is_mandatory
        ) VALUES (
            v_student_id,
            v_course_record.course_id,
            v_admin_user_id,
            v_course_record.earliest_completion,
            'Restored assignment - lost during progress_recalculation_fix on 2024-06-11',
            false
        );
        
        v_assignments_created := v_assignments_created + 1;
        RAISE NOTICE 'Created course assignment for course: %', v_course_record.course_title;
        
        -- Create missing course progress record
        INSERT INTO user_course_progress (
            user_id,
            course_id,
            status,
            progress_percentage,
            started_at,
            last_accessed_at,
            completed_at
        ) VALUES (
            v_student_id,
            v_course_record.course_id,
            v_status,
            v_progress_percentage,
            v_course_record.earliest_completion,
            v_course_record.latest_completion,
            CASE WHEN v_status = 'completed' THEN v_course_record.latest_completion ELSE NULL END
        );
        
        v_progress_created := v_progress_created + 1;
        RAISE NOTICE 'Created course progress for course: %', v_course_record.course_title;
        
        v_courses_restored := v_courses_restored + 1;
    END LOOP;
    
    -- Log the restoration operation in audit table
    INSERT INTO user_management_audit (
        target_user_id,
        action_type,
        performed_by,
        reason,
        new_data
    ) VALUES (
        v_student_id,
        'data_restoration',
        v_admin_user_id,
        'Restored missing course assignments and progress lost during progress_recalculation_fix on 2024-06-11',
        jsonb_build_object(
            'restoration_timestamp', now(),
            'courses_restored', v_courses_restored,
            'assignments_created', v_assignments_created,
            'progress_records_created', v_progress_created,
            'affected_email', 'student@test.com'
        )
    );
    
    -- Update learning streaks if needed
    PERFORM update_learning_streak(v_student_id);
    
    -- Final summary
    RAISE NOTICE 'Data restoration completed successfully!';
    RAISE NOTICE 'Courses restored: %', v_courses_restored;
    RAISE NOTICE 'Course assignments created: %', v_assignments_created;
    RAISE NOTICE 'Course progress records created: %', v_progress_created;
    RAISE NOTICE 'Student email: student@test.com';
    RAISE NOTICE 'Student ID: %', v_student_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Data restoration failed: % with SQLSTATE: %', SQLERRM, SQLSTATE;
END $$;