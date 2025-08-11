-- Performance indexes for accurate and timely progress tracking
-- These are safe, additive indexes to speed up common queries

-- User unit progress
CREATE INDEX IF NOT EXISTS idx_uup_user_course ON public.user_unit_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_uup_user_course_completed ON public.user_unit_progress (user_id, course_id) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_uup_course_unit ON public.user_unit_progress (course_id, unit_id);

-- User video progress
CREATE INDEX IF NOT EXISTS idx_uvp_user_course ON public.user_video_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_uvp_user_unit_course ON public.user_video_progress (user_id, unit_id, course_id);

-- Course progress
CREATE INDEX IF NOT EXISTS idx_ucp_user ON public.user_course_progress (user_id);

-- Supportive indexes for counts and joins
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_units_section_id ON public.units (section_id);