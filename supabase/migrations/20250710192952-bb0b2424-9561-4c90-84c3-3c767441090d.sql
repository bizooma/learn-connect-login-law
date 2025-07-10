-- Run bulk progress recalculation to fix Julio's progress
SELECT * FROM public.bulk_recalculate_course_progress('Fix Julio progress synchronization issue');