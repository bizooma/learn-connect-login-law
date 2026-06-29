
DO $$
DECLARE
  cat_id uuid := '5e3e4722-9ac3-4e81-9438-bf200c1992f4';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  doc_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Managing Filing Deadlines (3.20.1)', 'document', 0, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (doc_id, 'Introduction', 0, uid),
    (doc_id, 'Promptly Identify and Notify', 1, uid),
    (doc_id, 'Assess Impact', 2, uid),
    (doc_id, 'Client Communication', 3, uid),
    (doc_id, 'Internal Review', 4, uid),
    (doc_id, 'Documentation', 5, uid),
    (doc_id, 'Potential Bar Complaint', 6, uid),
    (doc_id, 'Reporting Process', 7, uid),
    (doc_id, 'Internal Documentation', 8, uid),
    (doc_id, 'Recap', 9, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Knowledge Check', 'quiz', 1, true, uid);
END $$;
