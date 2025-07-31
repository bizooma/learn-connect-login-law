-- Phase 1: Immediate fix for Sara's specific issue
SELECT admin_mark_unit_completed(
  '7bc548ec-3eca-4f01-9f6b-3f19daa83f27'::uuid, -- Sara's user_id
  'a44f0984-18a6-4027-9143-f123a2649d17'::uuid, -- Unit ID for "Red Flag: Visa overstays & USC child petitioners"
  '40cd2ef8-2db6-474c-b635-86df1835c5e1'::uuid, -- Course ID for "Legal Training-100"
  'Manual completion due to quiz completion flow failure - user passed quiz 3 times but unit did not complete'::text
);

-- Check if this resolved her course progress
SELECT update_course_progress_reliable(
  '7bc548ec-3eca-4f01-9f6b-3f19daa83f27'::uuid,
  '40cd2ef8-2db6-474c-b635-86df1835c5e1'::uuid
);