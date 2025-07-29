-- Directly mark Diana's unit as completed
INSERT INTO user_unit_progress (
    user_id,
    unit_id,
    course_id,
    completed,
    completed_at,
    video_completed,
    video_completed_at,
    completion_method,
    updated_at
) VALUES (
    'be94db50-3c4a-4d7d-8d2e-8b4e2025ec34'::uuid, -- Diana's user_id
    '38df05f5-67d3-4e27-9fce-7c5f4f11ce2e'::uuid, -- Setting the Agenda unit_id
    '50e9e252-519f-4624-9026-812035df6128'::uuid, -- Sales Training-100 course_id
    true,
    now(),
    true,
    now(),
    'manual_admin_fix',
    now()
) ON CONFLICT (user_id, unit_id, course_id) 
DO UPDATE SET
    completed = true,
    completed_at = now(),
    video_completed = true,
    video_completed_at = now(),
    completion_method = 'manual_admin_fix',
    updated_at = now();

-- Also mark video progress as completed
INSERT INTO user_video_progress (
    user_id,
    unit_id,
    course_id,
    watch_percentage,
    is_completed,
    completed_at,
    last_watched_at,
    updated_at
) VALUES (
    'be94db50-3c4a-4d7d-8d2e-8b4e2025ec34'::uuid, -- Diana's user_id
    '38df05f5-67d3-4e27-9fce-7c5f4f11ce2e'::uuid, -- Setting the Agenda unit_id
    '50e9e252-519f-4624-9026-812035df6128'::uuid, -- Sales Training-100 course_id
    100,
    true,
    now(),
    now(),
    now()
) ON CONFLICT (user_id, unit_id, course_id)
DO UPDATE SET
    watch_percentage = 100,
    is_completed = true,
    completed_at = now(),
    last_watched_at = now(),
    updated_at = now();