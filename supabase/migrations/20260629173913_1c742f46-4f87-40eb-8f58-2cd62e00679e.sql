
DO $$
DECLARE
  cat_id uuid := '558e67d5-d3a0-41d2-8dc5-d1e340644ed9';
  admin_id uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid := gen_random_uuid();
  doc_id uuid := gen_random_uuid();
  quiz_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.wiki_articles (id, category_id, title, content, sort_order, is_published, content_type, created_by)
  VALUES
    (overview_id, cat_id, 'Overview', '', 1, true, 'document', admin_id),
    (doc_id, cat_id, 'Create and Manage Tasks in HubSpot', '', 2, true, 'document', admin_id),
    (quiz_id, cat_id, 'Knowledge Check', '', 3, true, 'test', admin_id);

  INSERT INTO public.wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (overview_id, 'Purpose & Target', '', 1, admin_id),
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Navigate to the specific deal in HubSpot CRM', '', 2, admin_id),
    (doc_id, 'Create a new task with appropriate details', '', 3, admin_id),
    (doc_id, 'Set task priority based on urgency', '', 4, admin_id),
    (doc_id, 'Assign task to appropriate team member', '', 5, admin_id),
    (doc_id, 'Monitor and manage tasks through CRM or notification center', '', 6, admin_id),
    (doc_id, 'Edit tasks if needed', '', 7, admin_id),
    (doc_id, 'Mark tasks as complete when finished', '', 8, admin_id),
    (doc_id, 'Recap', '', 9, admin_id);
END $$;
