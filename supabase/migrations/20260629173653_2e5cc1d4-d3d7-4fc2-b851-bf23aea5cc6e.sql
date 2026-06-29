
DO $$
DECLARE
  cat_id uuid := 'a1e65db0-a730-436a-be5b-c64a596d56a3';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  doc_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Overview', 'document', 0, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (doc_id, 'Purpose & Target', 0, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Handling a Bar Complaint or Issue (3.21.1)', 'document', 1, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (doc_id, 'Introduction', 0, uid),
    (doc_id, 'Team member identifies and reports a potential Bar issue', 1, uid),
    (doc_id, 'Attorney reviews the situation and escalates to appropriate leadership', 2, uid),
    (doc_id, 'Document all relevant information in Filevine', 3, uid),
    (doc_id, 'Leadership determines whether to pursue remediation or file a formal Bar complaint', 4, uid),
    (doc_id, 'Follow State Bar Association protocols and document the resolution', 5, uid),
    (doc_id, 'Recap', 6, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Knowledge Check', 'quiz', 2, true, uid);
END $$;
