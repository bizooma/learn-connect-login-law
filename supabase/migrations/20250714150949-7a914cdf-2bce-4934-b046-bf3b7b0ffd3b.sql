-- Comprehensive data restoration for users with missing course assignments and progress records
-- This addresses the system-wide data integrity issue affecting 24+ users

DO $$
DECLARE
    v_user_record RECORD;
    v_total_restored_assignments INTEGER := 0;
    v_total_restored_progress INTEGER := 0;
    v_admin_user_id UUID;
BEGIN
    -- Get an admin user ID for audit logging
    SELECT user_id INTO v_admin_user_id 
    FROM user_roles 
    WHERE role = 'admin' 
    LIMIT 1;

    -- If no admin found, use the first admin from direct admin list
    IF v_admin_user_id IS NULL THEN
        SELECT id INTO v_admin_user_id 
        FROM profiles 
        WHERE email IN ('joe@bizooma.com', 'admin@newfrontieruniversity.com') 
        LIMIT 1;
    END IF;

    -- Process each user with completed unit progress but missing assignments
    FOR v_user_record IN 
        SELECT DISTINCT 
            uup.user_id,
            p.email,
            uup.course_id,
            c.title as course_title
        FROM user_unit_progress uup
        JOIN profiles p ON uup.user_id = p.id
        JOIN courses c ON uup.course_id = c.id
        WHERE uup.completed = true
        AND p.is_deleted = false
        AND NOT EXISTS (
            SELECT 1 FROM course_assignments ca 
            WHERE ca.user_id = uup.user_id AND ca.course_id = uup.course_id
        )
        ORDER BY p.email, c.title
    LOOP
        -- Create missing course assignment
        INSERT INTO public.course_assignments (
            user_id,
            course_id,
            assigned_by,
            assigned_at,
            notes,
            is_mandatory
        ) VALUES (
            v_user_record.user_id,
            v_user_record.course_id,
            COALESCE(v_admin_user_id, v_user_record.user_id),
            now(),
            'Data restoration: Assignment created based on existing unit completion progress',
            false
        );
        
        v_total_restored_assignments := v_total_restored_assignments + 1;
        
        -- Log individual assignment restoration
        IF v_admin_user_id IS NOT NULL THEN
            INSERT INTO public.user_management_audit (
                target_user_id,
                action_type,
                performed_by,
                reason,
                new_data
            ) VALUES (
                v_user_record.user_id,
                'assignment_restoration',
                v_admin_user_id,
                'Created missing course assignment during bulk restoration',
                jsonb_build_object(
                    'course_id', v_user_record.course_id,
                    'course_title', v_user_record.course_title,
                    'user_email', v_user_record.email
                )
            );
        END IF;
    END LOOP;

    -- Process each user with completed unit progress but missing course progress records
    FOR v_user_record IN 
        SELECT DISTINCT 
            uup.user_id,
            p.email,
            uup.course_id,
            c.title as course_title
        FROM user_unit_progress uup
        JOIN profiles p ON uup.user_id = p.id
        JOIN courses c ON uup.course_id = c.id
        WHERE uup.completed = true
        AND p.is_deleted = false
        AND NOT EXISTS (
            SELECT 1 FROM user_course_progress ucp 
            WHERE ucp.user_id = uup.user_id AND ucp.course_id = uup.course_id
        )
        ORDER BY p.email, c.title
    LOOP
        -- Calculate progress for this user/course combination
        WITH unit_stats AS (
            SELECT 
                COUNT(DISTINCT u.id) as total_units,
                COUNT(DISTINCT CASE WHEN uup.completed THEN uup.unit_id END) as completed_units,
                MIN(uup.completed_at) as first_completion,
                MAX(uup.completed_at) as last_completion
            FROM units u
            JOIN lessons l ON u.section_id = l.id
            LEFT JOIN user_unit_progress uup ON u.id = uup.unit_id AND uup.user_id = v_user_record.user_id
            WHERE l.course_id = v_user_record.course_id
            AND u.is_draft = false
        )
        INSERT INTO public.user_course_progress (
            user_id,
            course_id,
            progress_percentage,
            status,
            started_at,
            completed_at,
            last_accessed_at
        )
        SELECT 
            v_user_record.user_id,
            v_user_record.course_id,
            CASE 
                WHEN us.total_units > 0 THEN 
                    LEAST(100, (us.completed_units * 100) / us.total_units)
                ELSE 0 
            END,
            CASE 
                WHEN us.total_units > 0 AND us.completed_units = us.total_units THEN 'completed'
                WHEN us.completed_units > 0 THEN 'in_progress'
                ELSE 'not_started'
            END,
            COALESCE(us.first_completion, now()),
            CASE 
                WHEN us.total_units > 0 AND us.completed_units = us.total_units THEN us.last_completion
                ELSE NULL
            END,
            COALESCE(us.last_completion, now())
        FROM unit_stats us;
        
        v_total_restored_progress := v_total_restored_progress + 1;
        
        -- Log individual progress restoration
        IF v_admin_user_id IS NOT NULL THEN
            INSERT INTO public.user_management_audit (
                target_user_id,
                action_type,
                performed_by,
                reason,
                new_data
            ) VALUES (
                v_user_record.user_id,
                'progress_restoration',
                v_admin_user_id,
                'Created missing course progress during bulk restoration',
                jsonb_build_object(
                    'course_id', v_user_record.course_id,
                    'course_title', v_user_record.course_title,
                    'user_email', v_user_record.email
                )
            );
        END IF;
    END LOOP;

    -- Update all existing course progress records to ensure correct calculations
    UPDATE user_course_progress 
    SET 
        progress_percentage = CASE 
            WHEN total_units.count > 0 THEN 
                LEAST(100, (COALESCE(completed_units.count, 0) * 100) / total_units.count)
            ELSE 0 
        END,
        status = CASE 
            WHEN total_units.count > 0 AND COALESCE(completed_units.count, 0) = total_units.count THEN 'completed'
            WHEN COALESCE(completed_units.count, 0) > 0 THEN 'in_progress'
            ELSE 'not_started'
        END,
        completed_at = CASE 
            WHEN total_units.count > 0 AND COALESCE(completed_units.count, 0) = total_units.count 
                 AND completed_at IS NULL THEN latest_completion.completion_date
            ELSE completed_at
        END,
        updated_at = now()
    FROM (
        -- Count total units per course
        SELECT 
            l.course_id,
            COUNT(DISTINCT u.id) as count
        FROM units u
        JOIN lessons l ON u.section_id = l.id
        WHERE u.is_draft = false
        GROUP BY l.course_id
    ) total_units
    LEFT JOIN (
        -- Count completed units per user per course
        SELECT 
            uup.user_id,
            uup.course_id,
            COUNT(DISTINCT uup.unit_id) as count
        FROM user_unit_progress uup
        WHERE uup.completed = true
        GROUP BY uup.user_id, uup.course_id
    ) completed_units ON user_course_progress.user_id = completed_units.user_id 
                      AND user_course_progress.course_id = completed_units.course_id
    LEFT JOIN (
        -- Get latest completion date per user per course
        SELECT 
            uup.user_id,
            uup.course_id,
            MAX(uup.completed_at) as completion_date
        FROM user_unit_progress uup
        WHERE uup.completed = true
        GROUP BY uup.user_id, uup.course_id
    ) latest_completion ON user_course_progress.user_id = latest_completion.user_id 
                        AND user_course_progress.course_id = latest_completion.course_id
    WHERE user_course_progress.course_id = total_units.course_id;

    -- Update learning streaks for all affected users
    INSERT INTO user_learning_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date)
    SELECT DISTINCT
        uup.user_id,
        1, -- Will be recalculated by trigger
        1,
        DATE(MAX(uup.completed_at)),
        DATE(MIN(uup.completed_at))
    FROM user_unit_progress uup
    JOIN profiles p ON uup.user_id = p.id
    WHERE uup.completed = true
    AND p.is_deleted = false
    AND NOT EXISTS (
        SELECT 1 FROM user_learning_streaks uls 
        WHERE uls.user_id = uup.user_id
    )
    GROUP BY uup.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        last_activity_date = GREATEST(user_learning_streaks.last_activity_date, EXCLUDED.last_activity_date),
        updated_at = now();

    -- Create final audit summary if admin user found
    IF v_admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_management_audit (
            target_user_id,
            action_type,
            performed_by,
            reason,
            new_data
        ) VALUES (
            v_admin_user_id,
            'bulk_data_restoration_summary',
            v_admin_user_id,
            'System-wide data restoration completed',
            jsonb_build_object(
                'assignments_restored', v_total_restored_assignments,
                'progress_records_restored', v_total_restored_progress,
                'completed_at', now()
            )
        );
    END IF;

    -- Log summary
    RAISE NOTICE 'Data restoration complete: % assignments restored, % progress records restored', 
        v_total_restored_assignments, v_total_restored_progress;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during data restoration: %', SQLERRM;
    RAISE;
END $$;