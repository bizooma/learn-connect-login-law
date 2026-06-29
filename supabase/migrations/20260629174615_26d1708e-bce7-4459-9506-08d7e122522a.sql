
DO $$
DECLARE
  cat_id uuid := 'f1ba92f4-7734-40b4-b687-12c03d1947e1';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid; main_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Overview', 'procedure', 1, uid) RETURNING id INTO overview_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (overview_id, 'Purpose & Target', 1, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Ending Representation Following Threats of Bar Complaint', 'procedure', 2, uid) RETURNING id INTO main_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (main_id, 'Introduction', 1, uid),
    (main_id, 'Identify and Report the Threat', 2, uid),
    (main_id, 'Attorney Review & Initial Escalation', 3, uid),
    (main_id, 'End Representation', 4, uid),
    (main_id, 'Notify Internal Stakeholders', 5, uid),
    (main_id, 'Document Closure and Team Support', 6, uid),
    (main_id, 'Notes & Reminders', 7, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Knowledge Check', 'procedure', 3, uid);
END $$;
