-- Mark Diana's "Setting the Agenda" unit as completed using admin function
SELECT admin_mark_unit_completed(
  'a7b8bfe0-92c2-4c8c-9d93-c44d8c123456'::uuid, -- This will need to be Diana's actual user_id
  '38df05f5-67d3-4e27-9fce-7c5f4f11ce2e'::uuid, -- Setting the Agenda unit_id
  '50e9e252-519f-4624-9026-812035df6128'::uuid, -- Sales Training-100 course_id
  'Manual completion - video stuck issue reported by user'::text
);