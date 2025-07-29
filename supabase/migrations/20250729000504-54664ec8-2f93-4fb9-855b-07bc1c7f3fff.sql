-- Mark Diana's "Setting the Agenda" unit as completed using admin function with correct user ID
SELECT admin_mark_unit_completed(
  'be94db50-3c4a-4d7d-8d2e-8b4e2025ec34'::uuid, -- Diana's actual user_id
  '38df05f5-67d3-4e27-9fce-7c5f4f11ce2e'::uuid, -- Setting the Agenda unit_id
  '50e9e252-519f-4624-9026-812035df6128'::uuid, -- Sales Training-100 course_id
  'Manual completion - video stuck issue reported by user Diana Joya'::text
);