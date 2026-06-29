
DO $$
DECLARE
  cat_id uuid := 'efa640b4-4a4d-4964-81c8-181fdc121d64';
  admin_id uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid := gen_random_uuid();
  doc_id uuid := gen_random_uuid();
  quiz_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.wiki_articles (id, category_id, title, content, sort_order, is_published, content_type, created_by)
  VALUES
    (overview_id, cat_id, 'Purpose & Target', '', 1, true, 'document', admin_id),
    (doc_id, cat_id, 'Processing "Motions to Recalendar" or "Notices to Appear" without Removal Defense Contract', '', 2, true, 'document', admin_id),
    (quiz_id, cat_id, 'Knowledge Check', '', 3, true, 'test', admin_id);

  INSERT INTO public.wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (overview_id, 'Purpose & Target', '', 1, admin_id),
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Identifies MTRC/NTA (motion to recalendar) and NTA (notice to appear) in daily mail and alerts team', '', 2, admin_id),
    (doc_id, 'Verify current representation status in client contracts', '', 3, admin_id),
    (doc_id, 'Communicate to client to inform of MTRC/NTA and offer Removal Defense services if appropriate', '', 4, admin_id),
    (doc_id, 'Client decides whether to hire firm for Removal Defense representation if applicable', '', 5, admin_id),
    (doc_id, 'Execute appropriate follow-up actions based on client decision', '', 6, admin_id);
END $$;
