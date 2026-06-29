
DO $$
DECLARE
  cat_id uuid := 'ed3d8a78-5b03-44d3-b3da-d4e04fe2454d';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid; main_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Overview', 'procedure', 1, uid) RETURNING id INTO overview_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (overview_id, 'Purpose & Target', 1, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Conducting USCIS Interview Debrief', 'procedure', 2, uid) RETURNING id INTO main_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (main_id, 'Introduction', 1, uid),
    (main_id, 'Confirm interview occurred and check for outcome updates', 2, uid),
    (main_id, 'Contact client within the same day or next day', 3, uid),
    (main_id, 'Summarize outcome and next steps', 4, uid),
    (main_id, 'Update Filevine with notes', 5, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Knowledge Check', 'procedure', 3, uid);
END $$;
