
DO $$
DECLARE
  cat_id uuid := '51b445ae-f39d-46c0-af6f-7b178678ea23';
  admin_id uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid := gen_random_uuid();
  doc_id uuid := gen_random_uuid();
  quiz_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.wiki_articles (id, category_id, title, content, sort_order, is_published, content_type, created_by)
  VALUES
    (overview_id, cat_id, 'Overview', '', 1, true, 'document', admin_id),
    (doc_id, cat_id, 'Confirming Filing Fee Payment Before Submission', '', 2, true, 'document', admin_id),
    (quiz_id, cat_id, 'Knowledge Check', '', 3, true, 'test', admin_id);

  INSERT INTO public.wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (overview_id, 'Purpose & Target', '', 1, admin_id),
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Monitor assigned cases for Filing Assembly status and USCIS applicable fees', '', 2, admin_id),
    (doc_id, 'Submit a Filevine task to Finance containing complete payment details', '', 3, admin_id),
    (doc_id, 'Finance confirms payment status or provides clearance timeline', '', 4, admin_id),
    (doc_id, 'Advance case to Attorney Review and/or schedule Final Review ONLY after Finance approval', '', 5, admin_id),
    (doc_id, 'Record payment method and confirm use of IOLTA in Filevine', '', 6, admin_id),
    (doc_id, 'Exception Procedures (Edge Cases)', '', 7, admin_id);
END $$;
