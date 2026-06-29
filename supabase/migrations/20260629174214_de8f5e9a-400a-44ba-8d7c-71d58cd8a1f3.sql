
DO $$
DECLARE
  cat_id uuid := '48a7fd06-1069-4c41-8d8c-520ca423ddb7';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid; main_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Overview', 'procedure', 1, uid) RETURNING id INTO overview_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (overview_id, 'Purpose & Target', 1, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Conducting USCIS Interview Prep Call with Attorney', 'procedure', 2, uid) RETURNING id INTO main_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (main_id, 'Introduction', 1, uid),
    (main_id, 'Receive calendar invite and review Filevine notes and red flags', 2, uid),
    (main_id, 'Review the interview packet and case background', 3, uid),
    (main_id, 'Conduct mock interview with client', 4, uid),
    (main_id, 'Address flagged concerns or red flags', 5, uid),
    (main_id, 'Share additional preparation notes with legal team, if needed', 6, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Knowledge Check', 'procedure', 3, uid);
END $$;
